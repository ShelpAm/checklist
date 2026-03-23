<script lang="ts">
    import { ChecklistSynchronizer, ChecklistItem } from "$lib/index.svelte";
    import ChecklistItemComponent from "./checklist-item-component.svelte";

    let {
        item = $bindable(),
        cs = $bindable(),
    }: { item: ChecklistItem; cs: ChecklistSynchronizer } = $props();

    const add_subitem = () => {
        item.sublist.push(new ChecklistItem(item));
        cs.save();
    };

    const delete_this = () => {
        const confirmed = confirm(
            "Are you sure you want to delete this item and all its subitems FOREVER?",
        );
        if (!confirmed) {
            return;
        }

        if (!item.parent) {
            console.warn(
                "Trying to delete root item, which is not allowed. And this is probably a bug. Please report this to the developer.",
            );
            return;
        }
        const parent_list = item.parent.sublist;
        parent_list.splice(parent_list.indexOf(item), 1);
        cs.save();
    };

    let textbox: HTMLInputElement;
</script>

<li class="checklist-item">
    <input
        type="checkbox"
        name="checkbox"
        bind:checked={item.completed}
        onchange={() => {
            cs.save();
        }}
    />
    <input
        type="text"
        bind:this={textbox}
        bind:value={item.text}
        onkeydown={(e: KeyboardEvent) => e.key == "Enter" && textbox.blur()}
        onfocusout={() => cs.save()}
    />
    <input type="button" onclick={add_subitem} value="Add" />
    <input type="button" onclick={delete_this} value="Delete" />
    {#if item.sublist.length > 0}
        <ul>
            {#each item.sublist as subitem}
                <ChecklistItemComponent item={subitem} {cs} />
            {/each}
        </ul>
    {/if}
</li>
