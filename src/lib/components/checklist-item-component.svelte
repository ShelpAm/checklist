<script lang="ts">
    import { ChecklistSynchronizer, ChecklistItem } from "$lib/index.svelte";
    import ChecklistItemComponent from "./checklist-item-component.svelte";

    import add_icon from "$lib/assets/images/add.png";
    import delete_icon from "$lib/assets/images/delete.png";
    import expanded_icon from "$lib/assets/images/expanded.png";
    import collapsed_icon from "$lib/assets/images/collapsed.png";
    import drag_icon from "$lib/assets/images/drag.png";
    import { slide } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import { flip } from "svelte/animate";
    import { scale, fade } from "svelte/transition";

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
        // 如果拖拽的目标是文字输入框或 checkbox，阻止拖拽
        const target = e.target as HTMLElement;
        console.log("dragstart event target:", target);
        if (target.closest('input[type="text"]')) {
            console.log("脱错了");
            e.preventDefault();
            return;
        }

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
    out:scale
>
    <div bind:this={self} class="head">
        <img
            class="drag"
            src={drag_icon}
            alt="drag"
            draggable="true"
            {ondragstart}
            {ondragend}
            {ondragover}
        />
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
        <input
            type="image"
            onclick={add_subitem}
            src={add_icon}
            alt="add"
            disabled={item.completed}
        />
        <input
            type="image"
            onclick={delete_this}
            src={delete_icon}
            alt="delete"
        />
    </div>
    {#if item.sublist.length > 0 && item.expanded}
        <div
            class="sublist"
            transition:slide={{ duration: 400, easing: cubicOut }}
        >
            {#each item.sublist as subitem, i (subitem.id)}
                <div
                    animate:flip
                    style="animation-delay: {i * 40}ms"
                    class="fade-in"
                >
                    <ChecklistItemComponent
                        level={level + 1}
                        item={subitem}
                        {cs}
                    />
                </div>
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
        padding: 16px 16px 10px 16px;
        border: 1px solid grey;
        border: none;
        border-radius: 8px;
        box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2); /* x偏移 y偏移 模糊 半透明黑色 */
        box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.08),
            0 2px 6px rgba(0, 0, 0, 0.04);
    }

    .drag {
        width: 20px;
        height: 20px;
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

    .fade-in {
        opacity: 0;
        transform: translateY(-6px);
        animation: fadeIn 0.2s ease forwards;
    }

    @keyframes fadeIn {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    input[type="checkbox"] {
        width: 20px;
        height: 20px;
        margin-left: 8px;
    }

    input[type="checkbox"] {
        transition: transform 0.15s ease;
    }

    input[type="checkbox"]:checked {
        animation: check-pop 0.25s ease;
    }

    @keyframes check-pop {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.3);
        }
        100% {
            transform: scale(1);
        }
    }

    .completed .head {
        transition:
            opacity 0.2s ease,
            transform 0.2s ease;
        transform: scale(0.98);
    }

    input[type="text"] {
        min-width: 10px;
        margin-left: 5px;
        flex: 1;
        border: none;
        /*border-bottom: 1px solid grey;*/
        outline: none;
        font-size: 18px;

        /*transition: border 0.2s ease;*/
    }

    input[type="text"]:focus {
        border-bottom: 1px solid #4da3ff;
    }

    input[type="image"] {
        width: 20px;
        height: 20px;
        margin-left: 8px;
    }

    /*input[type="button"] {
        margin-left: 5px;
    }*/

    .drag-over-up {
        border-top: 2px solid #4da3ff;
        transform: translateY(-2px);
    }

    .drag-over-down {
        border-bottom: 2px solid #4da3ff;
        transform: translateY(2px);
    }

    .checklist-item {
        transition: transform 0.12s ease;
    }

    .head {
        transition:
            transform 0.15s ease,
            box-shadow 0.2s ease;
    }

    .head:hover {
        transform: translateY(-2px);
        box-shadow:
            0 12px 30px rgba(0, 0, 0, 0.12),
            0 4px 10px rgba(0, 0, 0, 0.05);
    }
</style>
