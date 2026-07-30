import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const baseUrl = "https://colocdz.com";
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/login?error=GoogleAuthFailed`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || "873960820010-r65bcqgvgg5m805tle3kgqb8ghv8bdor.apps.googleusercontent.com";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "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";
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    // 1. Exchange code for access token with Google
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google token exchange error:', tokenData);
      return NextResponse.redirect(`${baseUrl}/login?error=GoogleTokenExchangeFailed`);
    }

    // 2. Fetch Google profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    if (!profileRes.ok || !profile.email) {
      console.error('Google profile fetch error:', profile);
      return NextResponse.redirect(`${baseUrl}/login?error=GoogleProfileFetchFailed`);
    }

    const email = profile.email.toLowerCase().trim();
    const name = profile.name || profile.given_name || 'Google User';
    const image = profile.picture || null;

    // 3. Find or Create User in Prisma
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          emailVerified: true,
          image,
          identityVerified: true,
          faceVerified: true,
          faceVerifiedAt: new Date(),
          faceVerifiedUntil: new Date('2030-01-01T00:00:00.000Z'),
        }
      });
    }

    // 4. Find or Create Account in Prisma
    let account = await prisma.account.findFirst({
      where: { userId: user.id, providerId: 'google' }
    });

    if (!account) {
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: profile.id || user.id,
          providerId: 'google',
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || null,
        }
      });
    }

    // 5. Create Session & Cookie
    await createSession(user.id);

    return NextResponse.redirect(`${baseUrl}/`);
  } catch (error) {
    console.error('Google callback exception:', error);
    return NextResponse.redirect(`${baseUrl}/login?error=GoogleAuthException`);
  }
}
