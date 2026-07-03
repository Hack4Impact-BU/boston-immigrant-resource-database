export default {
  name: 'resourceSection',
  title: 'Resource Section',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Section Title',
      type: 'string',
    },
    {
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Text', value: 'text' },
          { title: 'Numbered List', value: 'numbered' },
        ],
      },
      initialValue: 'numbered',
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
    },
    {
      name: 'items',
      title: 'Resource Items',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'link',
              title: 'Link Text',
              type: 'string',
              description: 'The text that will be underlined and clickable',
            },
            {
              name: 'href',
              title: 'URL',
              type: 'string',
              description: 'The destination URL',
            },
            {
              name: 'before',
              title: 'Text Before Link',
              type: 'string',
              description: 'Optional text that appears before the link (only for text type)',
            },
            {
              name: 'after',
              title: 'Text After Link',
              type: 'string',
              description: 'Optional text that appears after the link',
            },
          ],
          preview: {
            select: {
              title: 'link',
            },
          },
        },
      ],
    },
  ],
}
