export default {
  name: 'aboutSection',
  title: 'About Section',
  type: 'document',
  fields: [
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
      initialValue: 'About BIRD',
    },
    {
      name: 'subheading',
      title: 'Subheading',
      type: 'string',
      initialValue: 'Boston Immigrant Resource Dashboard',
    },
    {
      name: 'paragraph',
      title: 'Paragraph',
      type: 'text',
      initialValue: 'To provide real-time, accessible information on essential resources for immigrants, refugees, and service providers—ensuring timely and effective support. To foster a “city of belonging” by creating a more connected and efficient support network for immigrants, refugees, and asylum seekers in Boston.',
    },
    {
      name: 'buttonText',
      title: 'Button Text',
      type: 'string',
      initialValue: 'Activate your Account',
    },
    {
      name: 'buttonLink',
      title: 'Button Link',
      type: 'string',
      initialValue: '/login',
    },
    {
      name: 'image1',
      title: 'First Image (Left Top)',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'image2',
      title: 'Second Image (Left Bottom)',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'image3',
      title: 'Third Image (Right Top)',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'image4',
      title: 'Fourth Image (Right Middle)',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'image5',
      title: 'Fifth Image (Right Bottom)',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
  ],
}
