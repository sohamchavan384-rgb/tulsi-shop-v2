import type { BlueprintResource } from '@sanity/blueprints';
export type GroupedBlueprintResource = {
    id: string;
    name: string;
    type: string;
};
export type GroupedBlueprintResources = Record<string, GroupedBlueprintResource[]>;
export declare function groupBlueprintResources(blueprintResources: BlueprintResource[]): GroupedBlueprintResources;
