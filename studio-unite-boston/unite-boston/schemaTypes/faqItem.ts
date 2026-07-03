export default {
  name: 'faqItem',
  title: 'FAQ Item',
  type: 'document',
  fields: [
    {
      name: 'section',
      title: 'Section',
      type: 'string',
      options: {
        list: [
          { title: 'General', value: 'general' },
          { title: 'For Providers', value: 'providers' },
        ],
      },
      initialValue: 'general',
    },
    {
      name: 'trigger',
      title: 'Question',
      type: 'string',
    },
    {
      name: 'content',
      title: 'Answer',
      type: 'text',
    },
  ],
}
