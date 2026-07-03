export default {
  name: 'partnersSection',
  title: 'Partners Section',
  type: 'document',
  fields: [
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
      initialValue: 'Our Partners',
    },
    {
      name: 'paragraph',
      title: 'Paragraph',
      type: 'text',
      initialValue: 'BIRD is accessible through a private dashboard. If your organization is working with immigrants in the Greater Boston area, use the “Contact Us” form to schedule a call or meeting for a BIRD orientation and how your organization can be included here.',
    },
    {
      name: 'buttonText',
      title: 'Button Text',
      type: 'string',
      initialValue: 'See Sponsors Below',
    },
    {
      name: 'buttonLink',
      title: 'Button Link',
      type: 'string',
      initialValue: '#sponsors',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
  ],
}
