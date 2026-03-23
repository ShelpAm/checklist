<script lang="ts">
    import type { Checklist } from "$lib";
    import ChecklistComponent from "$lib/components/checklist-component.svelte";

    // Example checklist
    const checklist: Checklist = {
        items: [
            {
                id: "1",
                text: "Example checklist item 1",
                completed: false,
                sublist: [
                    {
                        id: "1.1",
                        text: "Example sublist item 1.1",
                        completed: false,
                        sublist: [],
                        due_date: new Date(),
                    },
                    {
                        id: "1.2",
                        text: "Example sublist item 1.2",
                        completed: true,
                        sublist: [
                            {
                                id: "1.1",
                                text: "Example sublist item 1.1",
                                completed: false,
                                sublist: [],
                                due_date: new Date(),
                            },
                            {
                                id: "1.2",
                                text: "Example sublist item 1.2",
                                completed: true,
                                sublist: [],
                                due_date: new Date(),
                            },
                        ],
                        due_date: new Date(),
                    },
                ],
                due_date: new Date(),
            },
            {
                id: "2",
                text: "Example checklist item 2",
                completed: true,
                sublist: [],
                due_date: new Date(),
            },
        ],
    };
</script>

ShelpAm's Checklist for Dayly Life

<ChecklistComponent {checklist} />
