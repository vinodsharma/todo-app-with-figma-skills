import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  // Only protect /dashboard and /activity routes
  matcher: ['/dashboard/:path*', '/activity/:path*'],
}
