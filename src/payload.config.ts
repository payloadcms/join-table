// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    {
      slug: 'questions',
      admin: {
        useAsTitle: 'title',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          type: 'join',
          on: 'question',
          collection: 'questions-categories',
          name: 'category',
        },
      ],
    },
    {
      slug: 'categories',
      admin: {
        useAsTitle: 'title',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          type: 'join',
          on: 'category',
          collection: 'questions-categories',
          name: 'question',
        },
      ],
    },
    {
      slug: 'questions-categories',
      admin: {
        group: false,
        useAsTitle: 'title',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'categories',
            },
            {
              name: 'question',
              type: 'relationship',
              relationTo: 'questions',
            },
          ],
        },
        {
          name: 'order',
          type: 'number',
          required: true,
          defaultValue: 0,
          index: true,
        },
        {
          name: 'title',
          type: 'text',
          admin: {
            hidden: true,
          },
          hooks: {
            beforeChange: [
              async ({ data, req }) => {
                const questionID = data?.question
                const categoryID = data?.category

                if (questionID && categoryID) {
                  const question = await req.payload.findByID({
                    collection: 'questions',
                    id: questionID,
                    depth: 0,
                  })

                  const category = await req.payload.findByID({
                    collection: 'categories',
                    id: categoryID,
                    depth: 0,
                  })

                  return `Category: ${category.title} - Question: ${question.title}`
                }
              },
            ],
          },
        },
      ],
    },
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
})
