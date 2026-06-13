import { defaultSchema } from "rehype-sanitize";

export const markdownSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a || []),
      "href",
      "title",
      "target",
      "rel"
    ],
    code: [...(defaultSchema.attributes?.code || []), "className"],
    img: [
      ...(defaultSchema.attributes?.img || []),
      "src",
      "alt",
      "title",
      "width",
      "height"
    ],
    span: [...(defaultSchema.attributes?.span || []), "className"]
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ["http", "https"]
  }
};
