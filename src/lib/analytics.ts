import {
  Contact,
  FunnelMetrics,
  VelocityMetrics,
  DailyVolume,
  GhostingBucket,
  FupEffectiveness,
  StageAging,
  CumulativeBooking,
  DateRangeFilter,
} from "./types";

function filterByDateRange(contacts: Contact[], days: DateRangeFilter): Contact[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return contacts.filter((c) => new Date(c.dateCreated) >= cutoff);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function hoursBetween(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
}

function daysBetween(start: string, end: string): number {
  return hoursBetween(start, end) / 24;
}

export function calculateFunnelMetrics(contacts: Contact[], days: DateRangeFilter): FunnelMetrics {
  const filtered = filterByDateRange(contacts, days);
  
  const totalContacts = filtered.length;
  const qualifiedCount = filtered.filter((c) => c.qualifiedDate).length;
  const bookedCount = filtered.filter((c) => c.bookedDate).length;
  const ghostedCount = filtered.filter((c) => c.ghostedDate && !c.bookedDate).length;
  const fupCount = filtered.filter((c) => c.fupDate).length;
  const fupToBookedCount = filtered.filter((c) => c.fupDate && c.bookedDate).length;

  return {
    totalContacts,
    qualifiedCount,
    qualificationRate: totalContacts > 0 ? (qualifiedCount / totalContacts) * 100 : 0,
    bookedCount,
    bookingRate: qualifiedCount > 0 ? (bookedCount / qualifiedCount) * 100 : 0,
    ghostedCount,
    ghostRate: totalContacts > 0 ? (ghostedCount / totalContacts) * 100 : 0,
    fupCount,
    fupToBookedCount,
    recoveryRate: fupCount > 0 ? (fupToBookedCount / fupCount) * 100 : 0,
  };
}

export function calculateVelocityMetrics(contacts: Contact[], days: DateRangeFilter): VelocityMetrics {
  const filtered = filterByDateRange(contacts, days);

  const createdToQualifiedHours = filtered
    .filter((c) => c.qualifiedDate)
    .map((c) => hoursBetween(c.dateCreated, c.qualifiedDate!));

  const qualifiedToBookedHours = filtered
    .filter((c) => c.qualifiedDate && c.bookedDate)
    .map((c) => hoursBetween(c.qualifiedDate!, c.bookedDate!));

  const createdToGhostedHours = filtered
    .filter((c) => c.ghostedDate && !c.bookedDate)
    .map((c) => hoursBetween(c.dateCreated, c.ghostedDate!));

  return {
    createdToQualified: {
      median: median(createdToQualifiedHours),
      average: average(createdToQualifiedHours),
    },
    qualifiedToBooked: {
      median: median(qualifiedToBookedHours),
      average: average(qualifiedToBookedHours),
    },
    createdToGhosted: {
      median: median(createdToGhostedHours),
      average: average(createdToGhostedHours),
    },
  };
}

export function calculateDailyVolume(contacts: Contact[], days: DateRangeFilter): DailyVolume[] {
  const filtered = filterByDateRange(contacts, days);
  const volumeMap: Record<string, DailyVolume> = {};

  // Initialize all days in range
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    volumeMap[dateStr] = { date: dateStr, created: 0, qualified: 0, booked: 0, ghosted: 0 };
  }

  filtered.forEach((contact) => {
    const createdDate = contact.dateCreated.split("T")[0];
    if (volumeMap[createdDate]) volumeMap[createdDate].created++;

    if (contact.qualifiedDate) {
      const qualifiedDate = contact.qualifiedDate.split("T")[0];
      if (volumeMap[qualifiedDate]) volumeMap[qualifiedDate].qualified++;
    }

    if (contact.bookedDate) {
      const bookedDate = contact.bookedDate.split("T")[0];
      if (volumeMap[bookedDate]) volumeMap[bookedDate].booked++;
    }

    if (contact.ghostedDate && !contact.bookedDate) {
      const ghostedDate = contact.ghostedDate.split("T")[0];
      if (volumeMap[ghostedDate]) volumeMap[ghostedDate].ghosted++;
    }
  });

  return Object.values(volumeMap).sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateGhostingBuckets(contacts: Contact[], days: DateRangeFilter): GhostingBucket[] {
  const filtered = filterByDateRange(contacts, days);
  const ghosted = filtered.filter((c) => c.ghostedDate && !c.bookedDate);

  const buckets: Record<string, number> = {
    "Same day": 0,
    "1 day": 0,
    "2-3 days": 0,
    "4+ days": 0,
  };

  ghosted.forEach((contact) => {
    const daysToGhost = daysBetween(contact.dateCreated, contact.ghostedDate!);
    if (daysToGhost < 1) buckets["Same day"]++;
    else if (daysToGhost < 2) buckets["1 day"]++;
    else if (daysToGhost < 4) buckets["2-3 days"]++;
    else buckets["4+ days"]++;
  });

  const total = ghosted.length || 1;
  return Object.entries(buckets).map(([bucket, count]) => ({
    bucket,
    count,
    percentage: (count / total) * 100,
  }));
}

export function calculateFupEffectiveness(contacts: Contact[], days: DateRangeFilter): FupEffectiveness {
  const filtered = filterByDateRange(contacts, days);
  const fupContacts = filtered.filter((c) => c.fupDate);
  
  const totalFup = fupContacts.length;
  const convertedToBooked = fupContacts.filter((c) => c.bookedDate).length;
  const remainingInactive = totalFup - convertedToBooked;

  return {
    totalFup,
    convertedToBooked,
    conversionRate: totalFup > 0 ? (convertedToBooked / totalFup) * 100 : 0,
    remainingInactive,
    inactiveRate: totalFup > 0 ? (remainingInactive / totalFup) * 100 : 0,
  };
}

export function calculateStageAging(contacts: Contact[], days: DateRangeFilter): StageAging[] {
  const filtered = filterByDateRange(contacts, days);
  const now = new Date();

  const stages: StageAging[] = [
    { stage: "New (No Action)", contacts: [], count: 0 },
    { stage: "Qualified (Pending)", contacts: [], count: 0 },
    { stage: "In Follow-up", contacts: [], count: 0 },
  ];

  filtered.forEach((contact) => {
    // New - no status yet
    if (!contact.qualifiedDate && !contact.ghostedDate) {
      const daysSince = daysBetween(contact.dateCreated, now.toISOString());
      if (daysSince > 1) {
        stages[0].contacts.push({ name: contact.name, daysSinceAction: Math.floor(daysSince) });
      }
    }
    // Qualified but not booked or ghosted
    else if (contact.qualifiedDate && !contact.bookedDate && !contact.ghostedDate) {
      const daysSince = daysBetween(contact.qualifiedDate, now.toISOString());
      if (daysSince > 1) {
        stages[1].contacts.push({ name: contact.name, daysSinceAction: Math.floor(daysSince) });
      }
    }
    // In FUP but not converted
    else if (contact.fupDate && !contact.bookedDate) {
      const daysSince = daysBetween(contact.fupDate, now.toISOString());
      if (daysSince > 1) {
        stages[2].contacts.push({ name: contact.name, daysSinceAction: Math.floor(daysSince) });
      }
    }
  });

  stages.forEach((stage) => {
    stage.count = stage.contacts.length;
    stage.contacts.sort((a, b) => b.daysSinceAction - a.daysSinceAction);
    stage.contacts = stage.contacts.slice(0, 10); // Top 10 oldest
  });

  return stages.filter((s) => s.count > 0);
}

export function calculateCumulativeBookings(contacts: Contact[], days: DateRangeFilter): CumulativeBooking[] {
  const filtered = filterByDateRange(contacts, days);
  const booked = filtered.filter((c) => c.bookedDate);

  const dailyBookings: Record<string, number> = {};

  // Initialize all days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    dailyBookings[dateStr] = 0;
  }

  booked.forEach((contact) => {
    const bookedDate = contact.bookedDate!.split("T")[0];
    if (dailyBookings[bookedDate] !== undefined) {
      dailyBookings[bookedDate]++;
    }
  });

  let cumulative = 0;
  return Object.entries(dailyBookings)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => {
      cumulative += count;
      return { date, cumulative };
    });
}
