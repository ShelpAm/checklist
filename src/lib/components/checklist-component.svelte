<script lang="ts">
    import { ChecklistItem, ChecklistSynchronizer } from "$lib/index.svelte";
    import ChecklistItemComponent from "./checklist-item-component.svelte";

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

<input
    type="text"
    placeholder="Input your checkitem"
    bind:value={new_item_text}
    oninput={() => cs.mark_dirty()}
    onkeydown={(e: KeyboardEvent) => e.key == "Enter" && add_item()}
/>
<input type="button" value="Add task" onclick={add_item} />

<ul>
    {#each cs.checklist.root.sublist as subitem}
        <ChecklistItemComponent item={subitem} {cs} />
    {/each}
</ul>

<style>
    ul {
        list-style: none;
        padding: 0px;
    }
</style>
