export default {
  name: 'stat',
  title: 'Stat',
  type: 'document',
  fields: [
    {
      name: 'value',
      title: 'Value',
      type: 'string',
    },
    {
      name: 'label',
      title: 'Label',
      type: 'string',
    },
    {
      name: 'icon',
      title: 'Icon',
      type: 'string',
      // We could make this a reference to an icon icon, but for simplicity, string.
      // Alternatively, we could use a slug or enum. Let's keep as string for now.
    },
  ],
}
