/**
 * HRM Policy Loader
 * Loads and parses YAML policy files for each world
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { World } from '../common/types.js';

export interface PolicyConfig {
  policy_version: string;
  world: World;
  mission_template: {
    lives_start: number;
    questions: {
      standard: number;
      risk_at: number[];
      team_at: number[];
    };
    challenge_fallback: boolean;
  };
  compose: {
    max_quests_per_loop: number;
    modality_weights: {
      mcq: number;
      challenge: number;
      reflection: number;
    };
  };
  zpd: {
    start: string;
    adjust_rules: Array<{
      when: string;
      do: string;
    }>;
  };
  risk_guard: {
    max_attempts: number;
    cooldown_ms: number;
    boss_challenge_ids: Record<string, string>;
  };
  gamification: {
    base_points: {
      standard: number;
      risk: number;
      team: number;
    };
    bonus_minigame: {
      points: number;
      life_plus: number;
      life_cap: number;
    };
  };
  avatar_feedback: {
    success_style: string;
    fail_style: string;
  };
  story: {
    briefing: string;
    debrief_success: string;
    debrief_fail: string;
    cliffhanger: string;
  };
}

export class PolicyLoader {
  private cache: Map<World, PolicyConfig> = new Map();
  private policiesDir: string;

  constructor(policiesDir?: string) {
    this.policiesDir = policiesDir || join(process.cwd(), 'policies');
  }

  /**
   * Load policy for a specific world
   */
  async forWorld(world: World): Promise<PolicyConfig> {
    // Check cache first
    if (this.cache.has(world)) {
      return this.cache.get(world)!;
    }

    // Load from file
    const policyPath = join(this.policiesDir, `${world}.yaml`);
    
    try {
      const yamlContent = readFileSync(policyPath, 'utf-8');
      const policy = this.parseYAML(yamlContent);
      
      // Validate
      if (policy.world !== world) {
        throw new Error(`Policy world mismatch: expected ${world}, got ${policy.world}`);
      }

      // Cache and return
      this.cache.set(world, policy);
      return policy;
    } catch (error) {
      console.error(`Error loading policy for world ${world}:`, error);
      throw new Error(`Failed to load policy for world: ${world}`);
    }
  }

  /**
   * Simple YAML parser (basic key-value structure)
   * For production, consider using a proper YAML library like 'js-yaml'
   */
  private parseYAML(content: string): PolicyConfig {
    const lines = content.split('\n');
    const result: any = {};
    const stack: any[] = [result];
    let currentIndent = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Get indentation level
      const indent = line.search(/\S/);
      const key = trimmed.split(':')[0].trim();
      const value = trimmed.substring(trimmed.indexOf(':') + 1).trim();

      // Handle indentation changes
      if (indent < currentIndent) {
        // Pop stack
        const levels = Math.floor((currentIndent - indent) / 2);
        for (let i = 0; i < levels; i++) {
          stack.pop();
        }
      }

      currentIndent = indent;
      const current = stack[stack.length - 1];

      // Parse value
      if (value) {
        // Array value
        if (value.startsWith('[') && value.endsWith(']')) {
          const items = value.slice(1, -1).split(',').map(v => {
            const trimmed = v.trim();
            return isNaN(Number(trimmed)) ? trimmed : Number(trimmed);
          });
          current[key] = items;
        }
        // Object value
        else if (value.startsWith('{') && value.endsWith('}')) {
          const obj: any = {};
          const pairs = value.slice(1, -1).split(',');
          pairs.forEach(pair => {
            const [k, v] = pair.split(':').map(s => s.trim());
            obj[k] = isNaN(Number(v)) ? v : Number(v);
          });
          current[key] = obj;
        }
        // Boolean
        else if (value === 'true' || value === 'false') {
          current[key] = value === 'true';
        }
        // Number
        else if (!isNaN(Number(value))) {
          current[key] = Number(value);
        }
        // String
        else {
          current[key] = value.replace(/^["']|["']$/g, '');
        }
      } else {
        // New object
        current[key] = {};
        stack.push(current[key]);
      }
    }

    return result as PolicyConfig;
  }

  /**
   * Clear cache (useful for hot-reloading)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Preload all world policies
   */
  async preloadAll(): Promise<void> {
    const worlds: World[] = ['health', 'it', 'legal', 'public', 'factory'];
    await Promise.all(worlds.map(world => this.forWorld(world)));
    console.log('✅ All policies preloaded');
  }
}


