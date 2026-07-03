export default {
  name: 'partnerLogo',
  title: 'Partner Logo',
  type: 'document',
  fields: [
    {
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'alt',
      title: 'Alternative Text',
      type: 'string',
    },
  ],
}