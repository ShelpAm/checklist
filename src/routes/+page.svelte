<script lang="ts">
    import { browser } from "$app/environment";
    import { ChecklistSynchronizer } from "$lib/index.svelte";
    import ChecklistComponent from "$lib/components/checklist-component.svelte";

    // let {} = $props();

    let cs: ChecklistSynchronizer = new ChecklistSynchronizer();
    if (browser) {
        cs.load_from(localStorage);
    }
</script>

<h2>ShelpAm's Checklist for Daily Life</h2>

<ChecklistComponent {cs} />

<svelte:window
    onbeforeunload={(e) => {
        if (cs.is_dirty) e.preventDefault(); // Asks if user wants to discard unsaved changes
    }}
/>

<!-- Synchronized: {!cs.is_dirty} -->
