import { prisma } from "../db";

export async function factsForSession(sessionId: string): Promise<string[]> {
  const facts: string[] = [];
  
  try {
    // Get session info and user
    const session = await prisma.session.findUnique({
      where: { sessionId },
      include: { user: true }
    });
    
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    const userId = session.userId;
    
    // Get attempts for this user
    const attempts = await prisma.attempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
    
    // Convert attempts to facts
    attempts.forEach(attempt => {
      const part = attempt.questionType === 'risk' ? '"A"' : '"-"'; // Simplified
      facts.push(`answered(${JSON.stringify(sessionId)}, ${attempt.questionId}, ${part}, ${attempt.isCorrect}).`);
    });
    
    // Get progress/deadlines
    const progress = await prisma.progress.findMany({
      where: { userId }
    });
    
    progress.forEach(p => {
      if (p.deadlineIso) {
        facts.push(`deadline(${JSON.stringify(sessionId)}, ${JSON.stringify(p.deadlineIso)}).`);
      }
      if (p.finished) {
        facts.push(`completed(${JSON.stringify(userId)}, ${JSON.stringify(p.moduleId)}).`);
      }
    });
    
    // Get team memberships
    const teamMembers = await prisma.teamMember.findMany({
      where: { userId },
      include: { team: true }
    });
    
    teamMembers.forEach(tm => {
      facts.push(`team_member(${JSON.stringify(userId)}, ${JSON.stringify(tm.team.name)}).`);
      facts.push(`team_success_rate(${JSON.stringify(tm.team.name)}, ${tm.team.successRate}).`);
    });
    
    // Add current time
    facts.push(`now(${JSON.stringify(new Date().toISOString())}).`);
    
    // Add user XP
    facts.push(`user_xp(${JSON.stringify(userId)}, ${session.user.xp}).`);
    
    return facts;
    
  } catch (error) {
    console.error('Failed to build facts for session:', sessionId, error);
    return [`error(${JSON.stringify(sessionId)}, ${JSON.stringify((error as Error).message)}).`];
  }
}

export async function factsForUser(userId: string, moduleId?: string): Promise<string[]> {
  const facts: string[] = [];
  
  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    
    facts.push(`user_xp(${JSON.stringify(userId)}, ${user.xp}).`);
    
    // Get attempts (optionally filtered by module)
    const attempts = await prisma.attempt.findMany({
      where: { 
        userId,
        ...(moduleId && { moduleId })
      },
      orderBy: { createdAt: 'asc' }
    });
    
    attempts.forEach(attempt => {
      facts.push(`answered(${JSON.stringify(userId)}, ${JSON.stringify(attempt.moduleId)}, ${attempt.questionId}, ${JSON.stringify(attempt.questionType)}, ${attempt.isCorrect}).`);
      
      if (attempt.duration) {
        facts.push(`answer_duration(${JSON.stringify(userId)}, ${JSON.stringify(attempt.moduleId)}, ${attempt.questionId}, ${attempt.duration}).`);
      }
    });
    
    // Get modules (with requirements)
    const modules = await prisma.module.findMany({
      ...(moduleId && { where: { id: moduleId } })
    });
    
    modules.forEach(module => {
      facts.push(`module_req(${JSON.stringify(module.id)}, ${module.levelReqXP}).`);
      facts.push(`module_type(${JSON.stringify(module.id)}, ${JSON.stringify(module.moduleType)}).`);
    });
    
    // Add current time
    facts.push(`now(${JSON.stringify(new Date().toISOString())}).`);
    
    return facts;
    
  } catch (error) {
    console.error('Failed to build facts for user:', userId, error);
    return [`error(${JSON.stringify(userId)}, ${JSON.stringify((error as Error).message)}).`];
  }
}

export function escapeFactValue(value: any): string {
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function formatFactPredicate(predicate: string, ...args: any[]): string {
  const escapedArgs = args.map(escapeFactValue).join(', ');
  return `${predicate}(${escapedArgs}).`;
} 