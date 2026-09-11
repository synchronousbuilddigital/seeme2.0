import { getCloudinarySignature } from '../controllers/uploadController.js'

async function testControllerDirectly() {
  console.log('🧪 Testing getCloudinarySignature Controller directly...\n')

  const req = {
    query: { folder: 'seemee/videos', resource_type: 'video' },
    body: {}
  }

  const res = {
    json: (data) => {
      console.log('Controller returned JSON:', data)
      if (data.success && data.data?.signature) {
        console.log('\n✅ DIRECT CONTROLLER TEST PASSED!')
        console.log('CloudName:', data.data.cloudName)
        console.log('ApiKey:', data.data.apiKey)
        console.log('Signature:', data.data.signature.substring(0, 10) + '...')
      }
    },
    status: (code) => {
      console.log('Status set to:', code)
      return res
    }
  }

  await getCloudinarySignature(req, res, (err) => {
    if (err) console.error('Controller error:', err)
  })
}

testControllerDirectly()
