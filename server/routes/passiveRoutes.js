/**
 * passiveRoutes.js - Self-Healing Passive LP System
 * Last Edited: 2025-10-24 by Assistant - AUTO-HEALING SCHEMA DETECTION!
 */

import express from 'express';
import { supabase } from '../utils/supabase.js';
import { CircuitBreakerService } from '../shared/services/CircuitBreakerService.js';

const router = express.Router();
const circuitService = CircuitBreakerService.getInstance();

/**
 * 🔧 AUTO-HEALING SCHEMA REPAIR
 * Detects missing columns and fixes them automatically!
 */
async function autoHealSchema(error, tableName) {
  if (!error.message.includes('column') && !error.message.includes('lastPassiveClaimTime')) {
    return false; // Not a schema issue
  }
  
  try {
    console.log(`🔧 [AUTO-HEAL] Detected missing column in ${tableName}`);
    console.log(`🔧 [AUTO-HEAL] Error: ${error.message}`);
    
    // Add missing column
    const repairSQL = `
      ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS "lastPassiveClaimTime" timestamp;
      UPDATE ${tableName} SET "lastPassiveClaimTime" = NOW() - INTERVAL '8 hours' WHERE "lastPassiveClaimTime" IS NULL;
    `;
    
    console.log('🔧 [AUTO-HEAL] Applying schema repair...');
    
    // Execute repair using raw query
    const { error: repairError } = await supabase.rpc('exec_sql', {
      sql: repairSQL
    });
    
    if (repairError) {
      console.error('❌ [AUTO-HEAL] Repair failed:', repairError);
      return false;
    }
    
    console.log('✅ [AUTO-HEAL] Schema repaired successfully!');
    
    // Warm the schema cache
    await supabase.from(tableName).select('lastPassiveClaimTime').limit(1);
    
    console.log('✅ [AUTO-HEAL] Schema cache warmed');
    return true;
    
  } catch (healError) {
    console.error('❌ [AUTO-HEAL] Healing process failed:', healError);
    return false;
  }
}

/**
 * GET /api/passive/status - Get passive LP status for user
 */
router.get('/status', async (req, res) => {
  try {
    const { telegramId } = req.query;
    
    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'telegramId required'
      });
    }
    
    console.log(`💰 [PASSIVE] Getting status for user: ${telegramId}`);
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('telegramId', telegramId)
      .single();
      
    if (userError) {
      // Try auto-healing if schema error
      if (await autoHealSchema(userError, 'users')) {
        console.log('🔄 [PASSIVE] Retrying after schema repair...');
        
        const { data: retryUser, error: retryError } = await supabase
          .from('users')
          .select('*')
          .eq('telegramId', telegramId)
          .single();
          
        if (retryError) {
          throw new Error(`User lookup failed after repair: ${retryError.message}`);
        }
        
        user = retryUser;
      } else {
        throw new Error(`User lookup failed: ${userError.message}`);
      }
    }
    
    // Calculate passive LP
    const lastClaim = user.lastPassiveClaimTime ? new Date(user.lastPassiveClaimTime) : new Date(Date.now() - 8 * 60 * 60 * 1000);
    const now = new Date();
    const minutesOffline = Math.floor((now - lastClaim) / (1000 * 60));
    const maxClaimHours = 8;
    const maxClaimMinutes = maxClaimHours * 60;
    
    const clampedMinutes = Math.min(minutesOffline, maxClaimMinutes);
    const lpPerHour = user.lpPerHour || 250;
    const availableLP = Math.floor((clampedMinutes / 60) * lpPerHour);
    
    const status = {
      minutesOffline,
      availableLP,
      lpPerHour,
      canClaim: availableLP > 0,
      currentLP: user.lp || 0,
      maxClaimHours,
      lastClaimTime: lastClaim.toISOString()
    };
    
    console.log(`✅ [PASSIVE] Status: ${availableLP} LP available (${clampedMinutes} minutes)`);
    
    res.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    console.error('❌ [PASSIVE] Status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get passive status',
      details: error.message
    });
  }
});

/**
 * POST /api/passive/claim - Claim passive LP with AUTO-HEALING
 */
router.post('/claim', async (req, res) => {
  const breakerKey = 'passive-claim';
  
  try {
    const { telegramId } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'telegramId required'
      });
    }
    
    console.log(`💰 [PASSIVE LP] Claim request for user: ${telegramId}`);
    
    // Circuit breaker with auto-healing
    const executeWithCircuitBreaker = circuitService.createBreaker(breakerKey, {
      failureThreshold: 2,
      resetTimeout: 60000,
      onOpen: () => console.log(`🚨 [CIRCUIT] Passive claim breaker opened`),
      onHalfOpen: () => console.log(`🔄 [CIRCUIT] Passive claim breaker testing...`),
      onClose: () => console.log(`✅ [CIRCUIT] Passive claim breaker closed`)
    });
    
    const result = await executeWithCircuitBreaker(async () => {
      // Get user with auto-healing
      let user;
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('telegramId', telegramId)
          .single();
          
        if (userError) {
          // Try auto-healing if schema error
          if (await autoHealSchema(userError, 'users')) {
            console.log('🔄 [PASSIVE LP] Retrying user lookup after schema repair...');
            
            const { data: retryUser, error: retryError } = await supabase
              .from('users')
              .select('*')
              .eq('telegramId', telegramId)
              .single();
              
            if (retryError) {
              throw new Error(`User lookup failed after repair: ${retryError.message}`);
            }
            
            user = retryUser;
          } else {
            throw new Error(`User not found: ${userError.message}`);
          }
        } else {
          user = userData;
        }
      } catch (lookupError) {
        throw new Error(`User lookup error: ${lookupError.message}`);
      }
      
      // Calculate claimable LP
      const lastClaim = user.lastPassiveClaimTime ? new Date(user.lastPassiveClaimTime) : new Date(Date.now() - 8 * 60 * 60 * 1000);
      const now = new Date();
      const minutesOffline = Math.floor((now - lastClaim) / (1000 * 60));
      const maxClaimMinutes = 8 * 60; // 8 hours max
      
      const clampedMinutes = Math.min(minutesOffline, maxClaimMinutes);
      const lpPerHour = user.lpPerHour || 250;
      const claimableLP = Math.floor((clampedMinutes / 60) * lpPerHour);
      
      console.log(`💰 [PASSIVE LP] User ${telegramId}:`);
      console.log(`💰 [PASSIVE LP] - Time offline: ${minutesOffline} minutes (${(minutesOffline/60).toFixed(1)} hours)`);
      console.log(`💰 [PASSIVE LP] - LP per hour: ${lpPerHour}`);
      console.log(`💰 [PASSIVE LP] - Claiming: ${claimableLP} LP for ${clampedMinutes} minutes`);
      console.log(`💰 [PASSIVE LP] - Before claim: ${user.lp} LP`);
      
      if (claimableLP <= 0) {
        return {
          success: true,
          message: 'No LP to claim',
          claimed: 0,
          newBalance: user.lp,
          minutesOffline,
          nextClaimIn: Math.max(0, 60 - (minutesOffline % 60)) // Minutes until next LP
        };
      }
      
      // Update user with new balance and claim time
      const newBalance = user.lp + claimableLP;
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          lp: newBalance,
          lastPassiveClaimTime: now.toISOString()
        })
        .eq('telegramId', telegramId);
        
      if (updateError) {
        // Try auto-healing if update fails
        if (await autoHealSchema(updateError, 'users')) {
          console.log('🔄 [PASSIVE LP] Retrying update after schema repair...');
          
          const { error: retryError } = await supabase
            .from('users')
            .update({ 
              lp: newBalance,
              lastPassiveClaimTime: now.toISOString()
            })
            .eq('telegramId', telegramId);
            
          if (retryError) {
            throw new Error(`Update failed after repair: ${retryError.message}`);
          }
        } else {
          throw new Error(`Failed to update user balance: ${updateError.message}`);
        }
      }
      
      console.log(`💰 [PASSIVE LP] - After claim: ${newBalance} LP (gained ${claimableLP} LP)`);
      
      return {
        success: true,
        claimed: claimableLP,
        newBalance: newBalance,
        oldBalance: user.lp,
        minutesOffline,
        lpPerHour,
        nextClaimAvailable: now.toISOString()
      };
    });
    
    res.json(result);
    
  } catch (error) {
    console.error(`❌ [PASSIVE LP] Claim failed for ${req.body.telegramId}:`, error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to claim passive LP'
    });
  }
});

export default router;