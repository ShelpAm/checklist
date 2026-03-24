<script lang="ts">
    import { ChecklistItem, ChecklistSynchronizer } from "$lib/index.svelte";
    import ChecklistItemComponent from "./checklist-item-component.svelte";

    import send_icon from "$lib/assets/images/send.png";

    let { cs = $bindable() }: { cs: ChecklistSynchronizer } = $props();

    let new_item_text = $state("");

    let add_item = () => {
        cs.mark_dirty();
        console.log("Adding item with text:", new_item_text);

        let item = new ChecklistItem(cs.checklist.root);
        item.text = new_item_text;
        new_item_text = "";

        cs.checklist.root.sublist.push(item);
        cs.save();
    };
</script>

<header>
    <h2>ShelpAm's Checklist for Daily Life</h2>

    <input
        type="text"
        placeholder="Input your checkitem"
        bind:value={new_item_text}
        oninput={() => cs.mark_dirty()}
        onkeydown={(e: KeyboardEvent) => e.key == "Enter" && add_item()}
    />
    <button class="image-button" title="send" onclick={add_item}>
        <svg
            aria-hidden="true"
            focusable="false"
            class="octicon octicon-paper-airplane"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="currentColor"
            display="inline-block"
            overflow="visible"
            style="vertical-align: text-bottom;"
            ><path
                d="M.989 8 .064 2.68a1.342 1.342 0 0 1 1.85-1.462l13.402 5.744a1.13 1.13 0 0 1 0 2.076L1.913 14.782a1.343 1.343 0 0 1-1.85-1.463L.99 8Zm.603-5.288L2.38 7.25h4.87a.75.75 0 0 1 0 1.5H2.38l-.788 4.538L13.929 8Z"
            ></path></svg
        >
    </button>
</header>

<main>
    {#each cs.checklist.root.sublist as subitem}
        {#if !subitem.completed}
            <ChecklistItemComponent level={0} item={subitem} {cs} />
        {/if}
    {/each}
    {#each cs.checklist.root.sublist as subitem}
        {#if subitem.completed}
            <ChecklistItemComponent level={0} item={subitem} {cs} />
        {/if}
    {/each}
</main>

<style>
    header {
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* x偏移 y偏移 模糊 半透明黑色 */
    }

    input[type="text"] {
        margin-left: 5px;
        flex: 1;
        border: none;
        /*border-bottom: 1.5px solid grey;*/
        outline: none;
        font-size: 18px;
    }

    input[type="text"]:focus {
        border-bottom: 1px solid blue;
    }

    .image-button {
        transition: background-color 0.3s ease;
        background: none;
        border: none;
        border-radius: 4px;
        padding: 4px;
        cursor: pointer;
        width: 32px;
        height: 32px;
    }

    .image-button:hover {
        background-color: white;
        filter: brightness(80%);
    }
</style>
