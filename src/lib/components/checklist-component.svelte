<script lang="ts">
    import type { Checklist } from "$lib";
    import ChecklistItemComponent from "./checklist-item-component.svelte";

    let { checklist }: { checklist: Checklist } = $props();
</script>

<ul>
    {#each checklist.items as subitem}
        <ChecklistItemComponent item={subitem} />
    {/each}
</ul>
