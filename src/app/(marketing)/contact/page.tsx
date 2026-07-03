'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Play } from 'lucide-react'
import Sidebar from '@/components/marketing/Sidebar'

export default function ContactPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [formData, setFormData] = useState({
    organization: '',
    firstName: '',
    lastName: '',
    preferredMethod: 'email',
    email: '',
    phone: '',
    purposeMethod: 'more-information',
    message: '',
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setStatus('loading')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationName: formData.organization,
          firstName: formData.firstName,
          lastName: formData.lastName,
          primaryReasonForContact: formData.purposeMethod,
          preferredMethodOfContact: formData.preferredMethod,
          email: formData.email,
          phoneNumber: formData.phone,
          message: formData.message,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit contact request')
      }

      setStatus('success')
      setFormData({
        organization: '',
        firstName: '',
        lastName: '',
        preferredMethod: 'email',
        email: '',
        phone: '',
        purposeMethod: 'more-information',
        message: '',
      })
    } catch (error) {
      console.error('Form submission failed:', error)
      setStatus('error')
    }
  }

  const handleCancel = () => {
    setFormData({
      organization: '',
      firstName: '',
      lastName: '',
      preferredMethod: 'email',
      email: '',
      phone: '',
      purposeMethod: 'more-information',
      message: '',
    })
    setStatus('idle')
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} activePage="Contact us" />
      <main className="flex-1 bg-white px-8 py-12 ml-52">
        <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-semibold text-[#4c8cc9]">
          Contact Us
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-6 text-sm font-medium text-[#4c8cc9]">
              Basic information
            </h2>

            <div className="space-y-5">
              <div>
                <Label htmlFor="organization" className="mb-2 block text-xs font-medium text-slate-800">
                  Organization
                </Label>
                <Input
                  id="organization"
                  name="organization"
                  placeholder="Organization Name *"
                  value={formData.organization}
                  onChange={handleInputChange}
                  className="h-10 border-[#a8d0e6] bg-white text-sm placeholder:text-slate-400"
                />
              </div>

              <div>
                <Label htmlFor="firstName" className="mb-2 block text-xs font-medium text-slate-800">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="First Name *"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="h-10 border-[#a8d0e6] bg-white text-sm placeholder:text-slate-400"
                />
              </div>

              <div>
                <Label htmlFor="lastName" className="mb-2 block text-xs font-medium text-slate-800">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Last Name *"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="h-10 border-[#a8d0e6] bg-white text-sm placeholder:text-slate-400"
                />
              </div>

              <div>
                <Label className="mb-3 block text-xs font-medium text-slate-800">
                  Preferred Method of Contact
                </Label>
                <div className="flex gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded border border-[#a8d0e6] px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="preferredMethod"
                      value="Email"
                      checked={formData.preferredMethod === 'email'}
                      onChange={(e) => handleRadioChange('preferredMethod', e.target.value)}
                      className="h-4 w-4 cursor-pointer"
                    />
                    <span className="text-slate-700">Email</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded border border-[#a8d0e6] px-3 py-2 text-sm">
                    <input
                      type="radio"
                      name="preferredMethod"
                      value="Phone"
                      checked={formData.preferredMethod === 'phone'}
                      onChange={(e) => handleRadioChange('preferredMethod', e.target.value)}
                      className="h-4 w-4 cursor-pointer"
                    />
                    <span className="text-slate-700">Phone</span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="mb-2 block text-xs font-medium text-slate-800">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email Address *"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="h-10 border-[#a8d0e6] bg-white text-sm placeholder:text-slate-400"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="mb-2 block text-xs font-medium text-slate-800">
                  Phone{' '}
                  <span className="font-normal italic text-slate-500">
                    (not required, unless preferred method of contact)
                  </span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="h-10 border-[#a8d0e6] bg-white text-sm placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Purpose Section */}
          <div>
            <Label className="mb-3 block text-xs font-medium text-slate-800">
              Why are you contacting us?
            </Label>
            <div className="flex gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded border border-[#a8d0e6] px-3 py-2 text-sm">
                <input
                  type="radio"
                  name="purposeMethod"
                  value="more-information"
                  checked={formData.purposeMethod === 'more-information'}
                  onChange={(e) => handleRadioChange('purposeMethod', e.target.value)}
                  className="h-4 w-4 cursor-pointer"
                />
                <span className="text-slate-700">More Information</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded border border-[#a8d0e6] px-3 py-2 text-sm">
                <input
                  type="radio"
                  name="purposeMethod"
                  value="requesting-access"
                  checked={formData.purposeMethod === 'requesting-access'}
                  onChange={(e) => handleRadioChange('purposeMethod', e.target.value)}
                  className="h-4 w-4 cursor-pointer"
                />
                <span className="text-slate-700">Requesting Access</span>
              </label>
            </div>
          </div>

          {/* Message Section */}
          <div>
            <Label htmlFor="message" className="mb-3 block text-xs font-medium text-slate-800">
              Message
            </Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Tell us how we can help"
              value={formData.message}
              onChange={handleInputChange}
              className="min-h-28 border-[#a8d0e6] bg-white text-sm placeholder:text-slate-400"
              required
            />
          </div>

          {status === 'success' ? (
            <p className="text-sm text-green-600">Your contact request was sent successfully.</p>
          ) : null}
          {status === 'error' ? (
            <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
          ) : null}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              onClick={handleCancel}
              className="h-10 rounded bg-[#4c8cc9] px-6 text-sm font-medium text-white hover:bg-[#3d6fa8] cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={status === 'loading'}
              className="ml-auto flex h-10 items-center gap-2 rounded bg-[#4c8cc9] px-6 text-sm font-medium text-white hover:bg-[#3d6fa8] cursor-pointer"
            >
              {status === 'loading' ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </div>
    </main>
    </div>
  )
}
