export interface MasterItem {
    id: number;
    name: string;
}

export interface MasterOption {
    label: string;
    value: number;
}

export const toOptions = (items: MasterItem[]): MasterOption[] =>
    items.map((i) => ({ label: i.name, value: i.id }));
