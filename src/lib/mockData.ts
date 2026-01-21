import { Contact } from "./types";

// Generate realistic mock data
const firstNames = [
  "Emma", "Liam", "Olivia", "Noah", "Ava", "Oliver", "Isabella", "William",
  "Sophia", "James", "Mia", "Benjamin", "Charlotte", "Lucas", "Amelia",
  "Mason", "Harper", "Ethan", "Evelyn", "Alexander", "Abigail", "Henry",
  "Emily", "Sebastian", "Elizabeth", "Jack", "Sofia", "Aiden", "Avery",
  "Owen", "Ella", "Samuel", "Scarlett", "Ryan", "Grace", "Nathan", "Chloe",
  "John", "Victoria", "David", "Riley", "Leo", "Aria", "Dylan", "Lily"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
  "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"
];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

export function generateMockContacts(count: number = 200): Contact[] {
  const contacts: Contact[] = [];
  const now = new Date();
  const thirtyDaysAgo = addDays(now, -35);

  for (let i = 0; i < count; i++) {
    const dateCreated = randomDate(thirtyDaysAgo, addDays(now, -1));
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    // Simulate realistic funnel behavior
    const random = Math.random();
    let qualifiedDate: string | null = null;
    let bookedDate: string | null = null;
    let ghostedDate: string | null = null;
    let fupDate: string | null = null;

    if (random < 0.65) {
      // 65% get qualified (within 0-3 days)
      const hoursToQualify = Math.floor(Math.random() * 72) + 1;
      const qualified = addHours(dateCreated, hoursToQualify);
      if (qualified <= now) {
        qualifiedDate = qualified.toISOString();

        const nextRandom = Math.random();
        if (nextRandom < 0.55) {
          // 55% of qualified get booked (within 1-5 days)
          const hoursToBook = Math.floor(Math.random() * 96) + 24;
          const booked = addHours(qualified, hoursToBook);
          if (booked <= now) {
            bookedDate = booked.toISOString();
          }
        } else if (nextRandom < 0.85) {
          // 30% of qualified ghost (within 1-7 days)
          const hoursToGhost = Math.floor(Math.random() * 168) + 24;
          const ghosted = addHours(qualified, hoursToGhost);
          if (ghosted <= now) {
            ghostedDate = ghosted.toISOString();
            
            // 40% of ghosted go to FUP
            if (Math.random() < 0.4) {
              const hoursToFup = Math.floor(Math.random() * 48) + 24;
              const fup = addHours(new Date(ghostedDate), hoursToFup);
              if (fup <= now) {
                fupDate = fup.toISOString();
                
                // 35% of FUP convert to booked
                if (Math.random() < 0.35) {
                  const hoursToRecover = Math.floor(Math.random() * 72) + 24;
                  const recovered = addHours(fup, hoursToRecover);
                  if (recovered <= now) {
                    bookedDate = recovered.toISOString();
                    ghostedDate = null; // Clear ghosted if recovered
                  }
                }
              }
            }
          }
        }
        // 15% remain qualified but pending
      }
    } else if (random < 0.85) {
      // 20% ghost without qualifying
      const hoursToGhost = Math.floor(Math.random() * 96) + 12;
      const ghosted = addHours(dateCreated, hoursToGhost);
      if (ghosted <= now) {
        ghostedDate = ghosted.toISOString();
      }
    }
    // 15% are fresh leads with no action yet

    contacts.push({
      contactId: `contact-${i + 1}`,
      name: `${firstName} ${lastName}`,
      dateCreated: dateCreated.toISOString(),
      qualifiedDate,
      bookedDate,
      ghostedDate,
      fupDate,
    });
  }

  return contacts;
}
