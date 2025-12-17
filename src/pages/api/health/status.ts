/**
 * Read-Only Status Endpoint
 * 
 * PHASE 5: Production Hardening & Resilience
 * 
 * Exposes detailed system status.
 * READ-ONLY - No execution, no adapters, no state mutation.
 */

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed - read-only API' });
  }

  try {
    // PHASE 5: Read-only status
    // In production, this would access governance system status
    
    // const status = governanceSystem.getStatus();
    // return res.status(200).json({ success: true, status });
    
    return res.status(200).json({
      success: true,
      message: 'Status API - implementation pending',
      status: {
        mode: 'OBSERVE_ONLY',
        riskState: 'ACTIVE',
        tradingAllowed: false,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Status API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch status',
      details: error.message
    });
  }
}

