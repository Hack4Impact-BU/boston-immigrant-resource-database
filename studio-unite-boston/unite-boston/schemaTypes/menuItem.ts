export default {
  name: 'menuItem',
  title: 'Menu Item',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
    },
    {
      name: 'icon',
      title: 'Icon',
      type: 'url',
      // Assuming we store icons as images. Alternatively, we could use a string for icon name.
    },
    {
      name: 'href',
      title: 'Link',
      type: 'string',
    },
  ],
}
