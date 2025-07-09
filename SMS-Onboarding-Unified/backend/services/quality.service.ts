import { prisma } from './prisma';
import { CriticalLevel } from '../types/entities';

interface QualityScoreBreakdown {
  category: string;
  score: number;
  maxScore: number;
  issues: string[];
}

export async function calculateQualityScore(equipmentId: string): Promise<number> {
  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    include: {
      spareParts: true,
      documentation: true,
      photos: true,
    },
  });

  if (!equipment) {
    throw new Error('Equipment not found');
  }

  const breakdown: QualityScoreBreakdown[] = [];
  
  // 1. Basic Information Completeness (20 points)
  const basicInfoScore = calculateBasicInfoScore(equipment);
  breakdown.push(basicInfoScore);

  // 2. Documentation (20 points)
  const documentationScore = calculateDocumentationScore(equipment);
  breakdown.push(documentationScore);

  // 3. Photos (20 points)
  const photosScore = calculatePhotosScore(equipment);
  breakdown.push(photosScore);

  // 4. Spare Parts (20 points)
  const sparePartsScore = calculateSparePartsScore(equipment);
  breakdown.push(sparePartsScore);

  // 5. Critical Parts Identification (20 points)
  const criticalPartsScore = calculateCriticalPartsScore(equipment);
  breakdown.push(criticalPartsScore);

  // Calculate total score
  const totalScore = breakdown.reduce((sum, item) => sum + item.score, 0);
  const maxScore = breakdown.reduce((sum, item) => sum + item.maxScore, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);

  // Store breakdown in metadata
  await prisma.equipment.update({
    where: { id: equipmentId },
    data: {
      qualityScoreBreakdown: breakdown,
    },
  });

  return percentage;
}

function calculateBasicInfoScore(equipment: any): QualityScoreBreakdown {
  const issues: string[] = [];
  let score = 0;
  const maxScore = 20;

  // Check required fields
  if (equipment.name) score += 4;
  else issues.push('Equipment name is missing');

  if (equipment.manufacturer) score += 4;
  else issues.push('Manufacturer is missing');

  if (equipment.model) score += 4;
  else issues.push('Model is missing');

  if (equipment.serialNumber) score += 4;
  else issues.push('Serial number is missing');

  if (equipment.location) score += 4;
  else issues.push('Specific location is missing');

  return {
    category: 'Basic Information',
    score,
    maxScore,
    issues,
  };
}

function calculateDocumentationScore(equipment: any): QualityScoreBreakdown {
  const issues: string[] = [];
  let score = 0;
  const maxScore = 20;

  const docCount = equipment.documentation?.length || 0;

  if (docCount === 0) {
    issues.push('No documentation uploaded');
  } else if (docCount < 3) {
    score = 10;
    issues.push('Limited documentation (less than 3 documents)');
  } else {
    score = 20;
  }

  // Check for specific document types
  const docTypes = equipment.documentation?.map((d: any) => d.type) || [];
  const hasManual = docTypes.includes('manual');
  const hasCertificate = docTypes.includes('certificate');

  if (!hasManual && score > 0) {
    score -= 5;
    issues.push('No manual uploaded');
  }

  if (!hasCertificate && equipment.criticalLevel === CriticalLevel.CRITICAL) {
    score -= 5;
    issues.push('Critical equipment missing certificates');
  }

  return {
    category: 'Documentation',
    score: Math.max(0, score),
    maxScore,
    issues,
  };
}

function calculatePhotosScore(equipment: any): QualityScoreBreakdown {
  const issues: string[] = [];
  let score = 0;
  const maxScore = 20;

  const photoCount = equipment.photos?.length || 0;

  if (photoCount === 0) {
    issues.push('No photos uploaded');
  } else if (photoCount === 1) {
    score = 10;
    issues.push('Only one photo uploaded');
  } else if (photoCount >= 2) {
    score = 20;
  }

  // Check photo quality metadata if available
  const lowQualityPhotos = equipment.photos?.filter((p: any) => 
    p.metadata?.quality === 'low' || p.metadata?.blurry === true
  ).length || 0;

  if (lowQualityPhotos > 0) {
    score -= 5;
    issues.push(`${lowQualityPhotos} low quality photo(s)`);
  }

  return {
    category: 'Photos',
    score: Math.max(0, score),
    maxScore,
    issues,
  };
}

function calculateSparePartsScore(equipment: any): QualityScoreBreakdown {
  const issues: string[] = [];
  let score = 0;
  const maxScore = 20;

  const partCount = equipment.spareParts?.length || 0;

  if (partCount === 0) {
    issues.push('No spare parts listed');
  } else {
    // Base score for having parts
    score = 10;

    // Additional points for completeness
    const partsWithSuppliers = equipment.spareParts.filter((p: any) => 
      p.suppliers && p.suppliers.length > 0
    ).length;

    if (partsWithSuppliers === partCount) {
      score += 5;
    } else if (partsWithSuppliers > 0) {
      score += 2;
      issues.push('Some parts missing supplier information');
    } else {
      issues.push('No supplier information for parts');
    }

    // Check for stock levels
    const partsWithStock = equipment.spareParts.filter((p: any) => 
      p.currentStock > 0 && p.minimumStock > 0
    ).length;

    if (partsWithStock === partCount) {
      score += 5;
    } else if (partsWithStock > 0) {
      score += 2;
      issues.push('Some parts missing stock information');
    } else {
      issues.push('No stock level information for parts');
    }
  }

  return {
    category: 'Spare Parts',
    score: Math.max(0, score),
    maxScore,
    issues,
  };
}

function calculateCriticalPartsScore(equipment: any): QualityScoreBreakdown {
  const issues: string[] = [];
  let score = 0;
  const maxScore = 20;

  const partCount = equipment.spareParts?.length || 0;
  const criticalParts = equipment.spareParts?.filter((p: any) => 
    p.criticalLevel === CriticalLevel.CRITICAL
  ) || [];

  if (partCount === 0) {
    // No parts, so this category doesn't apply
    score = maxScore;
  } else if (criticalParts.length === 0) {
    // Has parts but none marked as critical
    score = 0;
    issues.push('No critical parts identified');
  } else {
    // Base score for identifying critical parts
    score = 10;

    // Check if critical parts have reasons
    const criticalWithReasons = criticalParts.filter((p: any) => 
      p.criticalReason && p.criticalReason.trim().length > 0
    ).length;

    if (criticalWithReasons === criticalParts.length) {
      score += 10;
    } else if (criticalWithReasons > 0) {
      score += 5;
      issues.push('Some critical parts missing justification');
    } else {
      issues.push('Critical parts lack justification');
    }
  }

  // Equipment criticality consistency check
  if (equipment.criticalLevel === CriticalLevel.CRITICAL && criticalParts.length === 0 && partCount > 0) {
    score = Math.max(0, score - 5);
    issues.push('Critical equipment should have critical parts');
  }

  return {
    category: 'Critical Parts',
    score: Math.max(0, score),
    maxScore,
    issues,
  };
}

export async function getQualityScoreBreakdown(equipmentId: string): Promise<{
  score: number;
  breakdown: QualityScoreBreakdown[];
  issues: string[];
}> {
  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: {
      qualityScore: true,
      qualityScoreBreakdown: true,
    },
  });

  if (!equipment) {
    throw new Error('Equipment not found');
  }

  const breakdown = equipment.qualityScoreBreakdown as QualityScoreBreakdown[] || [];
  const allIssues = breakdown.flatMap(item => item.issues);

  return {
    score: equipment.qualityScore || 0,
    breakdown,
    issues: allIssues,
  };
}

export async function getVesselQualityScore(vesselId: string): Promise<{
  overallScore: number;
  totalEquipment: number;
  completedEquipment: number;
  breakdown: {
    category: string;
    count: number;
    averageScore: number;
  }[];
}> {
  const equipment = await prisma.equipment.findMany({
    where: {
      vesselId,
      status: {
        notIn: ['deleted'],
      },
    },
    select: {
      id: true,
      qualityScore: true,
      categoryId: true,
      status: true,
    },
  });

  const totalEquipment = equipment.length;
  const completedEquipment = equipment.filter(e => 
    e.status === 'verified' || e.status === 'approved'
  ).length;

  if (totalEquipment === 0) {
    return {
      overallScore: 0,
      totalEquipment: 0,
      completedEquipment: 0,
      breakdown: [],
    };
  }

  // Calculate overall score
  const totalScore = equipment.reduce((sum, e) => sum + (e.qualityScore || 0), 0);
  const overallScore = Math.round(totalScore / totalEquipment);

  // Calculate breakdown by category
  const categoryScores = equipment.reduce((acc: any, e) => {
    if (!acc[e.categoryId]) {
      acc[e.categoryId] = { count: 0, totalScore: 0 };
    }
    acc[e.categoryId].count++;
    acc[e.categoryId].totalScore += e.qualityScore || 0;
    return acc;
  }, {});

  const breakdown = await Promise.all(
    Object.entries(categoryScores).map(async ([categoryId, data]: [string, any]) => {
      const category = await prisma.equipmentCategory.findUnique({
        where: { id: categoryId },
        select: { name: true },
      });

      return {
        category: category?.name || 'Unknown',
        count: data.count,
        averageScore: Math.round(data.totalScore / data.count),
      };
    })
  );

  return {
    overallScore,
    totalEquipment,
    completedEquipment,
    breakdown: breakdown.sort((a, b) => b.averageScore - a.averageScore),
  };
}