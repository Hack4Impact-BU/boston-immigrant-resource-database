export default {
  name: 'headerSettings',
  title: 'Header Settings',
  type: 'document',
  fields: [
    {
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'brandName',
      title: 'Brand Name',
      type: 'string',
      initialValue: 'BIRD',
    },
    {
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      initialValue: 'Boston Immigrant Resource Dashboard',
    },
    {
      name: 'navLinks',
      title: 'Navigation Links',
      type: 'array',
      of: [{type: 'navLink'}],
      initialValue: [
        { label: 'Create Account', href: '/login', iconName: '' },
        { label: 'Sign In', href: '/login', iconName: 'ChevronRight' },
      ],
    },
  ],
}
