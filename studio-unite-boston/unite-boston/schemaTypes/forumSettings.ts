export default {
  name: 'forumSettings',
  title: 'Forum Settings',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Internal Title',
      type: 'string',
      initialValue: 'Forum Settings',
    },
    {
      name: 'importantLinks',
      title: 'Important Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', title: 'Label', type: 'string' },
            { name: 'href', title: 'Link', type: 'string' },
          ],
        },
      ],
    },
    {
      name: 'rules',
      title: 'Rules',
      type: 'array',
      of: [{ type: 'string' }],
    },
  ],
  preview: {
    select: { title: 'title' },
  },
}
