import { prisma } from './prisma';

export async function ensureFestivalRegistered(festivalName?: string | null): Promise<string> {
  if (!festivalName || !festivalName.trim()) return 'Ganesh Festival';
  const clean = festivalName.trim();
  try {
    const existing = await prisma.festival.findFirst({
      where: { name: { equals: clean } },
    });
    if (!existing) {
      await prisma.festival.create({
        data: { name: clean },
      });
    }
  } catch (e) {
    // Ignore duplicate key error on concurrent entries
  }
  return clean;
}