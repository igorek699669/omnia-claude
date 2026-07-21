import type { CollectionConfig } from "payload";

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "scale", "price", "inStock"],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "soundCharacter",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "scale",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "scaleNotes",
      type: "text",
      required: true,
    },
    {
      name: "price",
      type: "number",
      required: true,
      min: 0,
    },
    {
      name: "oldPrice",
      type: "number",
      min: 0,
    },
    {
      name: "notesCount",
      type: "number",
      required: true,
      min: 8,
      max: 14,
    },
    {
      name: "weightGrams",
      type: "number",
      required: true,
    },
    {
      name: "diameterCm",
      type: "number",
      required: true,
    },
    {
      name: "material",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "inStock",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
    },
    {
      name: "media",
      type: "upload",
      relationTo: "media",
      hasMany: true,
    },
    {
      name: "video",
      type: "upload",
      relationTo: "media",
    },
  ],
};
