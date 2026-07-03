export default {
  name: 'forumComment',
  title: 'Forum Comment',
  type: 'document',
  fields: [
    {
      name: 'post',
      title: 'Post',
      type: 'reference',
      to: [{ type: 'forumPost' }],
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'authorName',
      title: 'Author Name',
      type: 'string',
    },
    {
      name: 'authorHandle',
      title: 'Author Handle',
      type: 'string',
    },
    {
      name: 'body',
      title: 'Body',
      type: 'text',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'upvotes',
      title: 'Upvotes',
      type: 'number',
      initialValue: 0,
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
    },
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'createdDesc',
      by: [{ field: 'createdAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'body', subtitle: 'authorName' },
  },
}
