<script lang="ts">
    import type { ChecklistItem } from "$lib";
    import ChecklistItemComponent from "./checklist-item-component.svelte";

    let { item }: { item: ChecklistItem } = $props();
</script>

<li class="checklist-item">
    <input
        type="checkbox"
        id={item.id}
        name="checkbox"
        checked={item.completed}
    />
    <label for={item.id}>{item.text}</label>
    {#if item.sublist.length > 0}
        <ul>
            {#each item.sublist as subitem}
                <ChecklistItemComponent item={subitem} />
            {/each}
        </ul>
    {/if}
</li>
