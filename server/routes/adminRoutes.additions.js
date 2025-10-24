/**
 * adminRoutes.additions.js - Auto-Healing Admin Endpoints
 * Last Edited: 2025-10-24 by Assistant - SLAP ALL THE BUGS!
 */

import express from 'express';
import { Debugger } from '../../shared/services/DebuggerService';
import HealthService from '../../shared/services/HealthService';
import { CircuitBreakerService } from '../../shared/services/CircuitBreakerService';
import { supabase } from '../utils/supabase';

const router = express.Router();

/**
 * 🔧 AUTO-HEALING SCHEMA REPAIR ENDPOINT
 * Tests if our automation can detect and fix missing DB columns
 */
router.post('/schema/repair', async (req, res) => {
  try {
    console.log('🔧 [AUTO-REPAIR] Starting automated schema repair...');
    
    const repairs = [];
    const errors = [];
    
    // Check for missing lastPassiveClaimTime column
    try {
      console.log('🔍 [AUTO-REPAIR] Checking users table schema...');
      
      // Try to query the column - if it fails, we need to add it
      const testQuery = await supabase
        .from('users')
        .select('lastPassiveClaimTime')
        .limit(1);
        
      if (testQuery.error && testQuery.error.message.includes('lastPassiveClaimTime')) {
        console.log('🚨 [AUTO-REPAIR] Missing column detected: users.lastPassiveClaimTime');
        
        // Auto-repair: Add the missing column
        const alterQuery = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastPassiveClaimTime" timestamp;`
        });
        
        if (!alterQuery.error) {
          console.log('✅ [AUTO-REPAIR] Added column: users.lastPassiveClaimTime');
          repairs.push('Added users.lastPassiveClaimTime column');
          
          // Update existing users with default values
          await supabase.rpc('exec_sql', {
            sql: `UPDATE users SET "lastPassiveClaimTime" = NOW() - INTERVAL '8 hours' WHERE "lastPassiveClaimTime" IS NULL;`
          });
          
          console.log('✅ [AUTO-REPAIR] Updated existing users with default lastPassiveClaimTime');
          repairs.push('Set default lastPassiveClaimTime for existing users');
        } else {
          console.error('❌ [AUTO-REPAIR] Failed to add column:', alterQuery.error);
          errors.push(`Failed to add lastPassiveClaimTime: ${alterQuery.error.message}`);
        }
      } else {
        console.log('✅ [AUTO-REPAIR] users.lastPassiveClaimTime column exists');
        repairs.push('users.lastPassiveClaimTime column verified');
      }
    } catch (schemaError) {
      console.error('❌ [AUTO-REPAIR] Schema check failed:', schemaError);
      errors.push(`Schema check error: ${schemaError.message}`);
    }
    
    // Warm schema cache
    try {
      console.log('🔄 [AUTO-REPAIR] Warming Supabase schema cache...');
      await supabase.from('users').select('*').limit(1);
      repairs.push('Schema cache warmed');
    } catch (cacheError) {
      errors.push(`Cache warm failed: ${cacheError.message}`);
    }
    
    // Reset circuit breakers
    try {
      console.log('🔄 [AUTO-REPAIR] Resetting circuit breakers...');
      const circuitService = CircuitBreakerService.getInstance();
      
      // Reset passive-claim breaker if it exists
      if (circuitService.getBreaker && circuitService.getBreaker('passive-claim')) {
        circuitService.getBreaker('passive-claim').reset();
        repairs.push('Reset passive-claim circuit breaker');
      }
      
      repairs.push('Circuit breakers reset');
    } catch (circuitError) {
      errors.push(`Circuit reset failed: ${circuitError.message}`);
    }
    
    const result = {
      success: errors.length === 0,
      timestamp: new Date().toISOString(),
      repairs: repairs,
      errors: errors,
      totalRepairs: repairs.length,
      totalErrors: errors.length
    };
    
    console.log('🎯 [AUTO-REPAIR] Repair completed:', result);
    
    res.json(result);
    
  } catch (error) {
    console.error('💥 [AUTO-REPAIR] Critical repair failure:', error);
    res.status(500).json({
      success: false,
      error: 'Auto-repair system failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 🔧 UPGRADE COST CALCULATION FIX
 * Fixes the backwards "was 225" discount calculation
 */
router.post('/upgrades/recalculate-costs', async (req, res) => {
  try {
    console.log('💰 [COST-FIX] Recalculating upgrade costs...');
    
    // Get all upgrades and recalculate their costs properly
    const { data: upgrades, error } = await supabase
      .from('upgrades')
      .select('*')
      .order('id');
      
    if (error) {
      throw new Error(`Failed to fetch upgrades: ${error.message}`);
    }
    
    const fixes = [];
    
    for (const upgrade of upgrades) {
      const currentLevel = upgrade.currentLevel || 0;
      const baseCost = upgrade.baseCost || 100;
      const costMultiplier = upgrade.costMultiplier || 1.5;
      
      // Calculate next cost properly (compound growth)
      const nextCost = Math.floor(baseCost * Math.pow(costMultiplier, currentLevel));
      
      // Check if cost needs fixing
      if (upgrade.nextCost !== nextCost) {
        console.log(`💰 [COST-FIX] ${upgrade.id}: ${upgrade.nextCost} → ${nextCost}`);
        
        // Update the upgrade cost
        await supabase
          .from('upgrades')
          .update({ nextCost: nextCost })
          .eq('id', upgrade.id);
          
        fixes.push({
          id: upgrade.id,
          name: upgrade.name,
          oldCost: upgrade.nextCost,
          newCost: nextCost,
          level: currentLevel
        });
      }
    }
    
    console.log(`✅ [COST-FIX] Fixed ${fixes.length} upgrade costs`);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      fixesApplied: fixes.length,
      fixes: fixes
    });
    
  } catch (error) {
    console.error('❌ [COST-FIX] Failed to fix upgrade costs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix upgrade costs',
      details: error.message
    });
  }
});

/**
 * 🔧 COMPREHENSIVE SYSTEM REPAIR
 * Runs all automated repairs in sequence
 */
router.post('/system/repair-all', async (req, res) => {
  try {
    console.log('🚀 [MEGA-REPAIR] Running comprehensive system repair...');
    
    const results = {
      timestamp: new Date().toISOString(),
      repairs: [],
      errors: []
    };
    
    // 1. Schema repair
    try {
      const schemaResponse = await fetch(`${req.protocol}://${req.get('host')}/api/admin/schema/repair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const schemaResult = await schemaResponse.json();
      
      if (schemaResult.success) {
        results.repairs.push(...schemaResult.repairs);
      } else {
        results.errors.push(...schemaResult.errors);
      }
    } catch (schemaError) {
      results.errors.push(`Schema repair failed: ${schemaError.message}`);
    }
    
    // 2. Upgrade cost fix
    try {
      const costResponse = await fetch(`${req.protocol}://${req.get('host')}/api/admin/upgrades/recalculate-costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const costResult = await costResponse.json();
      
      if (costResult.success) {
        results.repairs.push(`Fixed ${costResult.fixesApplied} upgrade costs`);
      } else {
        results.errors.push('Upgrade cost fix failed');
      }
    } catch (costError) {
      results.errors.push(`Cost fix failed: ${costError.message}`);
    }
    
    // 3. Clear all circuit breakers
    try {
      const circuitService = CircuitBreakerService.getInstance();
      // Reset all known breakers
      const breakers = ['passive-claim', 'upgrade-purchase', 'user-lookup'];
      let resetCount = 0;
      
      breakers.forEach(breakerName => {
        try {
          if (circuitService.getBreaker && circuitService.getBreaker(breakerName)) {
            circuitService.getBreaker(breakerName).reset();
            resetCount++;
          }
        } catch (e) {
          // Breaker doesn't exist - that's fine
        }
      });
      
      results.repairs.push(`Reset ${resetCount} circuit breakers`);
    } catch (circuitError) {
      results.errors.push(`Circuit reset failed: ${circuitError.message}`);
    }
    
    console.log(`🎯 [MEGA-REPAIR] Completed: ${results.repairs.length} repairs, ${results.errors.length} errors`);
    
    res.json({
      success: results.errors.length === 0,
      ...results
    });
    
  } catch (error) {
    console.error('💥 [MEGA-REPAIR] Critical failure:', error);
    res.status(500).json({
      success: false,
      error: 'Comprehensive repair failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export { router as adminAdditionsRouter };
export default router;