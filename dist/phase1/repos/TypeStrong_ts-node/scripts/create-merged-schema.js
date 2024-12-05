#!/usr/bin/env ts-node
"use strict";
/*
 * Create a complete JSON schema for tsconfig.json
 * by merging the schemastore schema with our ts-node additions.
 * This merged schema can be submitted in a pull request to
 * SchemaStore.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchemastoreSchema = getSchemastoreSchema;
const axios_1 = __importDefault(require("axios"));
const path_1 = require("path");
const fs_1 = require("fs");
async function main() {
    /** schemastore definition */
    const schemastoreSchema = await getSchemastoreSchema();
    /** ts-node schema auto-generated from ts-node source code */
    const originalTsNodeSchema = require('../tsconfig.schema.json');
    // Apply this prefix to the names of all ts-node-generated definitions
    const tsnodeDefinitionPrefix = 'tsNode';
    let tsNodeSchema = JSON.parse(JSON.stringify(originalTsNodeSchema).replace(/#\/definitions\//g, `#/definitions/${tsnodeDefinitionPrefix}`));
    tsNodeSchema.definitions = Object.fromEntries(Object.entries(tsNodeSchema.definitions).map(([key, value]) => [`${tsnodeDefinitionPrefix}${key}`, value]));
    // console.dir(tsNodeSchema, {
    //   depth: Infinity
    // });
    /** Patch ts-node stuff into the schemastore definition. */
    const mergedSchema = {
        ...schemastoreSchema,
        definitions: {
            ...Object.fromEntries(Object.entries(schemastoreSchema.definitions).filter(([key]) => !key.startsWith(tsnodeDefinitionPrefix))),
            ...tsNodeSchema.definitions,
            tsNodeTsConfigOptions: undefined,
            tsNodeTsConfigSchema: undefined,
            tsNodeDefinition: {
                properties: {
                    'ts-node': {
                        ...tsNodeSchema.definitions.tsNodeTsConfigOptions,
                        description: tsNodeSchema.definitions.tsNodeTsConfigSchema.properties['ts-node'].description,
                        properties: {
                            ...tsNodeSchema.definitions.tsNodeTsConfigOptions.properties,
                            compilerOptions: {
                                ...tsNodeSchema.definitions.tsNodeTsConfigOptions.properties.compilerOptions,
                                allOf: [
                                    {
                                        $ref: '#/definitions/compilerOptionsDefinition/properties/compilerOptions',
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        },
    };
    // Splice into the allOf array at a spot that looks good.  Does not affect
    // behavior of the schema, but looks nicer if we want to submit as a PR to schemastore.
    mergedSchema.allOf = mergedSchema.allOf.filter((item) => !item.$ref?.includes('tsNode'));
    mergedSchema.allOf.splice(mergedSchema.allOf.length - 1, 0, {
        $ref: '#/definitions/tsNodeDefinition',
    });
    (0, fs_1.writeFileSync)((0, path_1.resolve)(__dirname, '../tsconfig.schemastore-schema.json'), JSON.stringify(mergedSchema, null, 2));
}
async function getSchemastoreSchema() {
    const { data: schemastoreSchema } = await axios_1.default.get('https://schemastore.azurewebsites.net/schemas/json/tsconfig.json', { responseType: 'json' });
    return schemastoreSchema;
}
main();
//# sourceMappingURL=create-merged-schema.js.map