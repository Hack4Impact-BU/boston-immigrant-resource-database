export default {
  name: 'footerColumn',
  title: 'Footer Column',
  type: 'document',
  fields: [
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
    },
    {
      name: 'links',
      title: 'Links',
      type: 'array',
      of: [{type: 'footerLink'}],
    },
    {
      name: 'copyright',
      title: 'Show Copyright',
      type: 'boolean',
      initialValue: false,
    },
  ],
}
