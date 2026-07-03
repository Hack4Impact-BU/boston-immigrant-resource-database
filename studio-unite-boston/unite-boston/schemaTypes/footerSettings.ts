export default {
  name: 'footerSettings',
  title: 'Footer Settings',
  type: 'document',
  fields: [
    {
      name: 'columns',
      title: 'Footer Columns',
      type: 'array',
      of: [{type: 'footerColumn'}],
      initialValue: [
        {
          heading: 'Connect',
          links: [
            { label: 'Contact Us', href: '#contact' },
            { label: 'Newsletter signup', href: '#contact' },
          ],
          copyright: false,
        },
        {
          heading: 'Social',
          links: [
            { label: 'Facebook', href: '#' },
            { label: 'Instagram', href: '#' },
            { label: 'LinkedIn', href: '#' },
          ],
          copyright: false,
        },
        {
          heading: 'Legal',
          links: [{ label: 'Privacy policy', href: '#' }],
          copyright: true,
        },
      ],
    },
  ],
}
