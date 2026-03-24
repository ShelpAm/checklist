<script lang="ts">
    import { ChecklistSynchronizer, ChecklistItem } from "$lib/index.svelte";
    import ChecklistItemComponent from "./checklist-item-component.svelte";

    import add_icon from "$lib/assets/images/add.png";
    import delete_icon from "$lib/assets/images/delete.png";
    import expanded_icon from "$lib/assets/images/expanded.png";
    import collapsed_icon from "$lib/assets/images/collapsed.png";

    let {
        level,
        item = $bindable(),
        cs = $bindable(),
    }: {
        level: number;
        item: ChecklistItem;
        cs: ChecklistSynchronizer;
    } = $props();

    const add_subitem = () => {
        cs.mark_dirty();
        item.sublist.push(new ChecklistItem(item));
        item.expanded = true;
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
        cs.mark_dirty();
        const parent_list = item.parent.sublist;
        parent_list.splice(parent_list.indexOf(item), 1);
        cs.save();
    };

    const is_dragged_top_half = (e: DragEvent) => {
        const rect = div.getBoundingClientRect();
        const offset = e.clientY - rect.top;
        return offset < rect.height / 2;
    };

    const remove_dragover_classes = () => {
        const dragovers = (self.getRootNode() as HTMLElement).querySelectorAll(
            ".drag-over-up, .drag-over-down",
        );
        dragovers.forEach((e) =>
            e.classList.remove("drag-over-up", "drag-over-down"),
        );
    };

    const ondragstart = (e: DragEvent) => {
        e.stopPropagation();

        console.log("dragstart target:", item.text);
        cs.checklist.dragged_item = item;
    };

    const ondragend = (e: DragEvent) => {
        try {
            e.stopPropagation(); // Only handle event once
            remove_dragover_classes();

            const dragged_item = cs.checklist.dragged_item;
            const dragged_dest = cs.checklist.dragged_dest;
            if (!dragged_item)
                throw new Error("dragged_item is null, which is impossible.");
            if (!dragged_dest) return; // Disables self moving

            // Only handles sibling event
            if (dragged_item.parent != dragged_dest.dest_item.parent) return;

            console.log(
                dragged_dest.dest_item.id,
                "received drop from",
                dragged_item.id,
            );
            const parent_list = dragged_item.parent?.sublist;
            if (!parent_list)
                throw new Error("parent_list is null, which is impossible.");

            // if (dragged_item == dragged_dest.dest_item) {
            //     console.log("Dragging item to itself, which is a no-op. Ignoring.");
            //     cs.checklist.dragged_item = null;
            //     cs.checklist.dragged_dest = null;
            //     return;
            // }

            cs.mark_dirty();
            const src_idx = parent_list.indexOf(dragged_item);
            const src = parent_list.splice(src_idx, 1)[0];
            // Calculate dest index after removing the src item. This prevents from
            // possible bug related to index calculation.
            const dst_idx = parent_list.indexOf(dragged_dest.dest_item);
            parent_list.splice(dst_idx + (dragged_dest.is_up ? 0 : 1), 0, src);
            cs.save();
        } finally {
            cs.checklist.dragged_item = null;
            cs.checklist.dragged_dest = null;
            cs.checklist.dragover_cnt = 0;
        }
    };

    const ondragover = (e: DragEvent) => {
        cs.checklist.dragover_cnt += 1;
        // Ignores first dragover event, whose data is incorrect.
        if (cs.checklist.dragover_cnt == 1) {
            return;
        }
        console.log("dragover evnet:", e);
        e.preventDefault(); // Allows drop

        // Only keeps siblings, which is also the deepest element.
        if (cs.checklist.dragged_item?.parent != item.parent) return;

        console.log(
            "dragover target:",
            item.text,
            "dragged_item:",
            cs.checklist.dragged_item?.text,
        );

        // Disables self moving
        if (cs.checklist.dragged_item == item) {
            cs.checklist.dragged_dest = null;
            return;
        }

        remove_dragover_classes();
        if (is_dragged_top_half(e)) {
            div.classList.add("drag-over-up");
            cs.checklist.dragged_dest = { dest_item: item, is_up: true };
        } else {
            div.classList.add("drag-over-down");
            cs.checklist.dragged_dest = { dest_item: item, is_up: false };
        }
    };

    let div: HTMLDivElement;
    let self: HTMLDivElement;
    let textbox: HTMLInputElement;
</script>

<div
    bind:this={div}
    class="checklist-item"
    class:completed={level == 0 && item.completed}
    role="listitem"
    draggable="true"
    {ondragstart}
    {ondragend}
    {ondragover}
>
    <div bind:this={self} class="head">
        <input
            type="image"
            class="drawer"
            onclick={() => {
                item.expanded = !item.expanded;
                cs.mark_dirty();
                cs.save();
            }}
            src={item.expanded ? expanded_icon : collapsed_icon}
            alt={item.expanded ? "collapse" : "expand"}
        />
        <input
            type="checkbox"
            name="checkbox"
            bind:checked={item.completed}
            onchange={() => {
                cs.mark_dirty();
                item.propagate_completed();
                cs.save();
            }}
        />
        <input
            type="text"
            name="text"
            bind:this={textbox}
            bind:value={item.text}
            oninput={() => cs.mark_dirty()}
            onchange={() => {
                cs.mark_dirty();
                cs.save();
            }}
        /><!-- When dirty, set is_dirty to true -->
        <input type="image" onclick={add_subitem} src={add_icon} alt="add" />
        <input
            type="image"
            onclick={delete_this}
            src={delete_icon}
            alt="delete"
        />
    </div>
    {#if item.sublist.length > 0 && item.expanded}
        <div class="sublist">
            {#each item.sublist as subitem}
                <ChecklistItemComponent level={level + 1} item={subitem} {cs} />
            {/each}
        </div>
    {/if}
</div>

<!-- This keeps .drag-over from being pruned. Svelte will remove those unused
css selector.-->
<div class="drag-over-up drag-over-down completed" hidden></div>

<style lang="css">
    .checklist-item {
        margin: 12px 0;
    }

    .sublist {
        padding-left: 40px;
    }

    .completed {
        opacity: 0.5;
    }

    .head {
        display: flex;
        align-items: center;
        padding: 12px 12px 10px 12px;
        border: 1px solid grey;
        border-radius: 4px;
    }

    .drawer {
        width: 24px;
        height: 24px;
    }

    .drag-over-up {
        border-top: 2px solid blue;
    }

    .drag-over-down {
        border-bottom: 2px solid blue;
    }

    input[type="checkbox"] {
        width: 20px;
        height: 20px;
        margin-left: 8px;
    }

    input[type="text"] {
        margin-left: 5px;
        flex: 1;
        border: none;
        /*border-bottom: 1px solid grey;*/
        outline: none;
        font-size: 18px;
    }

    input[type="text"]:focus {
        border-bottom: 1px solid blue;
    }

    input[type="image"] {
        width: 20px;
        height: 20px;
        margin-left: 8px;
    }

    /*input[type="button"] {
        margin-left: 5px;
    }*/
</style>
