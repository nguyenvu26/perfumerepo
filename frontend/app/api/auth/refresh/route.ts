import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({
        user: {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'admin'
        },
        token: 'dummy-token-refresh'
    });
}
