export default {
  name: 'forumPost',
  title: 'Forum Post',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
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
      name: 'category',
      title: 'Category',
      type: 'string',
      initialValue: 'Community',
    },
    {
      name: 'body',
      title: 'Body',
      type: 'text',
    },
    {
      name: 'media',
      title: 'Media',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'linkUrl',
      title: 'Link URL',
      type: 'url',
    },
    {
      name: 'upvotes',
      title: 'Upvotes',
      type: 'number',
      initialValue: 0,
    },
    {
      name: 'downvotes',
      title: 'Downvotes',
      type: 'number',
      initialValue: 0,
    },
    {
      name: 'solved',
      title: 'Solved',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'isDraft',
      title: 'Is Draft',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'poll',
      title: 'Poll',
      type: 'object',
      fields: [
        {
          name: 'endsInDays',
          title: 'Ends in (days)',
          type: 'number',
        },
        {
          name: 'options',
          title: 'Options',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'text', title: 'Text', type: 'string' },
                { name: 'votes', title: 'Votes', type: 'number', initialValue: 0 },
              ],
            },
          ],
        },
      ],
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
    select: { title: 'title', subtitle: 'authorName' },
  },
}
