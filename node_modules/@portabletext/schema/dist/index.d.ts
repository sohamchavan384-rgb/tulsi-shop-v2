/**
 * @public
 */
type Schema = {
  block: {
    name: string;
    fields?: ReadonlyArray<FieldDefinition>;
  };
  span: {
    name: string;
  };
  styles: ReadonlyArray<StyleSchemaType>;
  lists: ReadonlyArray<ListSchemaType>;
  decorators: ReadonlyArray<DecoratorSchemaType>;
  annotations: ReadonlyArray<AnnotationSchemaType>;
  blockObjects: ReadonlyArray<BlockObjectSchemaType>;
  inlineObjects: ReadonlyArray<InlineObjectSchemaType>;
};
/**
 * @public
 */
type StyleSchemaType = BaseDefinition & {
  /**
   * @deprecated
   * Use `name` instead
   */
  value: string;
};
/**
 * @public
 */
type ListSchemaType = BaseDefinition & {
  /**
   * @deprecated
   * Use `name` instead
   */
  value: string;
};
/**
 * @public
 */
type DecoratorSchemaType = BaseDefinition & {
  /**
   * @deprecated
   * Use `name` instead
   */
  value: string;
};
/**
 * @public
 */
type AnnotationSchemaType = BaseDefinition & {
  fields: ReadonlyArray<FieldDefinition>;
};
/**
 * @public
 */
type BlockObjectSchemaType = BaseDefinition & {
  fields: ReadonlyArray<FieldDefinition>;
};
/**
 * @public
 */
type InlineObjectSchemaType = BaseDefinition & {
  fields: ReadonlyArray<FieldDefinition>;
};
/**
 * @public
 * Describes a member type within an array field's `of`.
 *
 * Three forms:
 * - `BlockOfDefinition` (`type: 'block'`) - declares a nested text block,
 *   with PTE sub-schema configurable inline.
 * - `InlineObjectOfDefinition` (`type: 'object'`) - inline-declares an
 *   object shape at this position. `name` is the type identity; `fields`
 *   defines the shape.
 * - `ReferenceOfDefinition` (`type: <name>`) - a bare reference to a type
 *   declared in `blockObjects` or `inlineObjects` at the schema root.
 */
type OfDefinition = BlockOfDefinition | InlineObjectOfDefinition | ReferenceOfDefinition;
/**
 * @public
 * An `of` member with `type: 'block'` -- supports nested PTE sub-schema.
 *
 * When this entry appears in a container field's `of`, it declares a nested
 * text block. Each sub-schema field is inherited from the root schema when
 * absent, or fully overrides root when defined. Resolution happens at
 * `compileSchema` time; after compilation, all fields are populated and can
 * be read directly without merging.
 */
type BlockOfDefinition = {
  type: 'block';
  name?: string;
  title?: string;
  styles?: ReadonlyArray<BaseDefinition>;
  decorators?: ReadonlyArray<BaseDefinition>;
  annotations?: ReadonlyArray<BaseDefinition & {
    fields?: ReadonlyArray<FieldDefinition>;
  }>;
  lists?: ReadonlyArray<BaseDefinition>;
  inlineObjects?: ReadonlyArray<BaseDefinition & {
    fields?: ReadonlyArray<FieldDefinition>;
  }>;
};
/**
 * @public
 * An `of` member with `type: 'object'` -- inline-declares an object shape.
 *
 * `name` is the type identity at this position. `fields` defines the shape.
 * Use this when the type only needs to exist at this nesting position. For
 * types referenced from multiple positions, declare them once at the schema
 * root (`blockObjects`) and use a `ReferenceOfDefinition` at each call site.
 */
type InlineObjectOfDefinition = {
  type: 'object';
  name: string;
  title?: string;
  fields: ReadonlyArray<FieldDefinition>;
};
/**
 * @public
 * An `of` member referencing a type declared elsewhere by name.
 *
 * `type` is the lookup key. Resolves to the matching entry in the schema's
 * `blockObjects` or `inlineObjects`. Self-references and cycles are
 * supported via cycle detection on the resolver walk.
 *
 * Throws at `compileSchema` time when the referenced type isn't declared.
 */
type ReferenceOfDefinition = {
  type: string;
  name?: string;
  title?: string;
};
/**
 * @public
 */
type FieldDefinition = (BaseDefinition & {
  type: 'array';
  of?: ReadonlyArray<OfDefinition>;
}) | (BaseDefinition & {
  type: 'string' | 'number' | 'boolean' | 'object';
});
/**
 * @public
 */
type BaseDefinition = {
  name: string;
  title?: string;
};
/**
 * @public
 */
type SchemaDefinition = {
  block?: {
    name?: string;
    fields?: ReadonlyArray<FieldDefinition>;
  };
  styles?: ReadonlyArray<StyleDefinition>;
  lists?: ReadonlyArray<ListDefinition>;
  decorators?: ReadonlyArray<DecoratorDefinition>;
  annotations?: ReadonlyArray<AnnotationDefinition>;
  blockObjects?: ReadonlyArray<BlockObjectDefinition>;
  inlineObjects?: ReadonlyArray<InlineObjectDefinition>;
};
/**
 * @public
 * A helper wrapper that adds editor support, such as autocomplete and type checking, for a schema definition.
 * @example
 * ```ts
 * import { defineSchema } from '@portabletext/editor'
 *
 * const schemaDefinition = defineSchema({
 *  decorators: [{name: 'strong'}, {name: 'em'}, {name: 'underline'}],
 *  annotations: [{name: 'link'}],
 *  styles: [
 *    {name: 'normal'},
 *    {name: 'h1'},
 *    {name: 'h2'},
 *    {name: 'h3'},
 *    {name: 'blockquote'},
 *  ],
 *  lists: [],
 *  inlineObjects: [],
 *  blockObjects: [],
 * }
 * ```
 */
declare function defineSchema<const TSchemaDefinition extends SchemaDefinition>(definition: TSchemaDefinition): TSchemaDefinition;
/**
 * @public
 */
type StyleDefinition<TBaseDefinition extends BaseDefinition = BaseDefinition> = TBaseDefinition;
/**
 * @public
 */
type ListDefinition<TBaseDefinition extends BaseDefinition = BaseDefinition> = TBaseDefinition;
/**
 * @public
 */
type DecoratorDefinition<TBaseDefinition extends BaseDefinition = BaseDefinition> = TBaseDefinition;
/**
 * @public
 */
type AnnotationDefinition<TBaseDefinition extends BaseDefinition = BaseDefinition> = TBaseDefinition & {
  fields?: ReadonlyArray<FieldDefinition>;
};
/**
 * @public
 */
type BlockObjectDefinition<TBaseDefinition extends BaseDefinition = BaseDefinition> = TBaseDefinition & {
  fields?: ReadonlyArray<FieldDefinition>;
};
/**
 * @public
 */
type InlineObjectDefinition<TBaseDefinition extends BaseDefinition = BaseDefinition> = TBaseDefinition & {
  fields?: ReadonlyArray<FieldDefinition>;
};
/**
 * @public
 */
declare function compileSchema(definition: SchemaDefinition): Schema;
/**
 * Derive the resolved sub-schema for a container field's `of` declaration.
 *
 * Containers declare which types are allowed inside them via the `of`
 * array on a child field. `getSubSchema(schema, of)` returns the resolved
 * `Schema` view that applies inside such a container, so operations and
 * validators that ask "what's allowed at this position?" can treat the
 * result like any other top-level `Schema`.
 *
 * The `{type: 'block'}` entry (if present) supplies the resolved
 * styles, decorators, annotations, lists, and inlineObjects. Non-block
 * `of` members become the schema's block objects. When there is no
 * `{type: 'block'}` entry the returned schema still carries the root
 * schema's `block` and `span` names but every validation list is
 * empty.
 *
 * @public
 */
declare function getSubSchema(schema: Schema, of: ReadonlyArray<OfDefinition>): Schema;
/**
 * @public
 */
interface TypedObject {
  [key: string]: unknown;
  _type: string;
}
/**
 * @public
 */
declare function isTypedObject(object: unknown): object is TypedObject;
/**
 * @public
 */
type PortableTextBlock = PortableTextTextBlock | PortableTextObject;
/**
 * @public
 */
interface PortableTextTextBlock<TChild = PortableTextSpan | PortableTextObject> {
  _type: string;
  _key: string;
  children: TChild[];
  markDefs?: PortableTextObject[];
  listItem?: string;
  style?: string;
  level?: number;
}
/**
 * @public
 */
declare function isTextBlock(context: {
  schema: Schema;
}, block: unknown): block is PortableTextTextBlock;
/**
 * @public
 */
interface PortableTextSpan {
  _key: string;
  _type: 'span';
  text: string;
  marks?: string[];
}
/**
 * @public
 */
declare function isSpan(context: {
  schema: Schema;
}, child: unknown): child is PortableTextSpan;
/**
 * @public
 */
interface PortableTextObject {
  _type: string;
  _key: string;
  [other: string]: unknown;
}
/**
 * @public
 */
type PortableTextChild = PortableTextSpan | PortableTextObject;
/**
 * @public
 */
interface PortableTextListBlock extends PortableTextTextBlock {
  listItem: string;
  level: number;
}
export { type AnnotationDefinition, type AnnotationSchemaType, type BaseDefinition, type BlockObjectDefinition, type BlockObjectSchemaType, type BlockOfDefinition, type DecoratorDefinition, type DecoratorSchemaType, type FieldDefinition, type InlineObjectDefinition, type InlineObjectOfDefinition, type InlineObjectSchemaType, type ListDefinition, type ListSchemaType, type OfDefinition, type PortableTextBlock, type PortableTextChild, type PortableTextListBlock, type PortableTextObject, type PortableTextSpan, type PortableTextTextBlock, type ReferenceOfDefinition, type Schema, type SchemaDefinition, type StyleDefinition, type StyleSchemaType, type TypedObject, compileSchema, defineSchema, getSubSchema, isSpan, isTextBlock, isTypedObject };
//# sourceMappingURL=index.d.ts.map