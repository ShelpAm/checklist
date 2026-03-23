// place files you want to import through the `$lib` alias in this folder.

// Checklist
export interface Checklist {
    items: ChecklistItem[];
}

export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
    sublist: ChecklistItem[];
    due_date?: Date;
}
