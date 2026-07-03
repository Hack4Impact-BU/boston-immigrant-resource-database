export default {
  name: 'contactSettings',
  title: 'Contact Settings',
  type: 'document',
  fields: [
    {
      name: 'contactReasons',
      title: 'Contact Reasons',
      type: 'array',
      of: [{type: 'string'}],
      initialValue: ['More information', 'Requesting Access'],
    },
    {
      name: 'contactMethods',
      title: 'Contact Methods',
      type: 'array',
      of: [{type: 'string'}],
      initialValue: ['Email', 'Phone'],
    },
  ],
}
