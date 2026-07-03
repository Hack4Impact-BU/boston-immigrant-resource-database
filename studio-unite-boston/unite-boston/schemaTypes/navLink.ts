export default {
  name: 'navLink',
  title: 'Nav Link',
  type: 'document',
  fields: [
    {
      name: 'label',
      title: 'Label',
      type: 'string',
    },
    {
      name: 'href',
      title: 'URL',
      type: 'string',
    },
    {
      name: 'iconName',
      title: 'Icon Name (from Lucide)',
      type: 'string',
      description: 'The name of the icon from Lucide (e.g., ChevronRight). Leave blank for no icon.',
    },
  ]
}
