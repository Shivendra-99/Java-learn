import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"
import { TypeHierarchyDiagram } from "@/components/diagram/type-hierarchy-diagram"

const oldProblems = `// java.util.Date, and why it was replaced
Date date = new Date(2024, 5, 15);   // year 3924, June 15th
//                   ^ years since 1900   ^ months are ZERO-BASED

date.setHours(9);            // mutable — anyone holding a reference sees this
SimpleDateFormat fmt = ...;  // not thread-safe, a classic production bug
Calendar cal = ...;          // verbose, still mutable, still zero-based months

// java.time (Java 8, from Joda-Time) fixed all of it:
// immutable, thread-safe, sensibly named, and explicit about time zones.`

const coreTypes = `LocalDate.now()                   // 2026-08-20        — a date, no time, no zone
LocalTime.now()                   // 14:30:00          — a time, no date, no zone
LocalDateTime.now()               // 2026-08-20T14:30  — both, still no zone
ZonedDateTime.now()               // ...+01:00[Europe/London]  — a real moment somewhere
Instant.now()                     // 2026-08-20T13:30:00Z      — a point on the UTC timeline

Duration.ofHours(3)               // machine time: seconds and nanos
Period.ofMonths(2)                // human time: years, months, days
Year.of(2026)  YearMonth.of(2026, 8)  MonthDay.of(8, 20)`

const creating = `LocalDate.of(2026, 8, 20);
LocalDate.of(2026, Month.AUGUST, 20);
LocalDate.parse("2026-08-20");                    // ISO-8601 by default

LocalDate today = LocalDate.now();
LocalDate later = today.plusWeeks(2).plusDays(3); // returns a NEW date
LocalDate first = today.withDayOfMonth(1);
LocalDate endOfMonth = today.with(TemporalAdjusters.lastDayOfMonth());
LocalDate nextFriday = today.with(TemporalAdjusters.next(DayOfWeek.FRIDAY));

today.getDayOfWeek();             // THURSDAY
today.isLeapYear();
today.isBefore(later);            // comparison, not compareTo < 0
today.lengthOfMonth();`

const arithmetic = `// Duration: exact elapsed time
Duration meeting = Duration.between(start, end);
meeting.toMinutes();
Duration.ofMinutes(90).plusSeconds(30);

// Period: calendar time, which is not the same thing
Period stay = Period.between(checkIn, checkOut);
stay.getMonths();

// Why both exist: "one month later" depends on which month,
// and "24 hours later" is not always "the same time tomorrow"
// because of daylight saving.
LocalDate.of(2026, 1, 31).plusMonths(1);      // 2026-02-28, clamped

ChronoUnit.DAYS.between(start, end);          // when you just want a number`

const zones = `// Store instants, display in a zone
Instant now = Instant.now();                          // UTC, unambiguous
ZoneId london = ZoneId.of("Europe/London");
ZonedDateTime local = now.atZone(london);

// Converting back
Instant back = local.toInstant();

// The rules that matter:
// - Instant for anything you PERSIST or compare across systems
// - ZonedDateTime when you must show or schedule a local wall-clock time
// - LocalDate/LocalDateTime when the zone is genuinely irrelevant
//   (a birthday, a shop's opening time)

ZoneId.systemDefault();          // fine for a desktop app, a trap on a server`

const formatting = `DateTimeFormatter iso = DateTimeFormatter.ISO_LOCAL_DATE;
DateTimeFormatter uk = DateTimeFormatter.ofPattern("dd/MM/yyyy");
DateTimeFormatter human = DateTimeFormatter
        .ofLocalizedDate(FormatStyle.MEDIUM)
        .withLocale(Locale.UK);

today.format(uk);                          // "20/08/2026"
LocalDate.parse("20/08/2026", uk);

// DateTimeFormatter is IMMUTABLE and thread-safe — you can and should
// keep one in a static final field. SimpleDateFormat could not be shared,
// and sharing it anyway was one of the most common concurrency bugs in Java.`

const dstExample = `// The 24-hour trap, made concrete
ZoneId london = ZoneId.of("Europe/London");
ZonedDateTime before = ZonedDateTime.of(2026, 3, 28, 12, 0, 0, 0, london);

before.plusDays(1);      // 2026-03-29T12:00+01:00 — same wall clock, 23 hours later
before.plus(Duration.ofDays(1));   // 2026-03-29T13:00+01:00 — exactly 24 hours later

// The clocks went forward at 01:00 on the 29th. Both answers are
// correct; they answer different questions. "Same time tomorrow"
// is a calendar operation; "24 hours from now" is a duration.`

export default function DateAndTimeLesson() {
  return (
    <>
      <p>
        Java's original date API was bad enough that a third-party replacement, Joda-Time, became near-universal —
        and was then adopted into the JDK as <code>java.time</code>. Everything you write should use it. The
        remaining difficulty isn't the API; it's that dates and times are genuinely harder than they look.
      </p>

      <h2>Why the old API was replaced</h2>
      <CodeBlock language="java" filename="java.util.Date" code={oldProblems} />

      <h2>The types, and choosing between them</h2>
      <TypeHierarchyDiagram
        title="Which type do you need?"
        initialSelected="localdate"
        nodes={[
          {
            id: "human",
            name: "Human time",
            kind: "interface",
            tag: "calendar concepts",
            detail: "Types that model how people talk about time: a date on a calendar, a time on a clock. They may or may not identify a unique moment.",
          },
          {
            id: "localdate",
            name: "LocalDate",
            kind: "final",
            parent: "human",
            tag: "2026-08-20",
            detail:
              "A date with no time and no zone. Right for birthdays, invoice dates, contract terms — anything where 'the 20th of August' means the same thing everywhere.",
          },
          {
            id: "localtime",
            name: "LocalTime",
            kind: "final",
            parent: "human",
            tag: "14:30",
            detail: "A time of day with no date. Right for opening hours or a recurring alarm — a wall-clock reading, not a moment.",
          },
          {
            id: "localdatetime",
            name: "LocalDateTime",
            kind: "final",
            parent: "human",
            tag: "no zone!",
            detail:
              "Date and time, still with no zone — so it does NOT identify a unique instant. The most misused type in the API: storing one for a global event loses the information needed to compare it with another.",
          },
          {
            id: "zoneddatetime",
            name: "ZonedDateTime",
            kind: "final",
            parent: "human",
            tag: "a real moment",
            detail:
              "A LocalDateTime plus a ZoneId, so it identifies an actual instant and knows about daylight saving. Use it when you must schedule or display local wall-clock time.",
          },
          {
            id: "machine",
            name: "Machine time",
            kind: "interface",
            tag: "the timeline",
            detail: "Types that model a continuous timeline in seconds and nanoseconds, with no calendar concepts attached.",
          },
          {
            id: "instant",
            name: "Instant",
            kind: "final",
            parent: "machine",
            tag: "UTC point",
            detail:
              "A point on the UTC timeline. This is what you persist, log, and compare — unambiguous everywhere. Convert to a zone only when displaying it to someone.",
          },
          {
            id: "duration",
            name: "Duration",
            kind: "final",
            parent: "machine",
            tag: "exact elapsed time",
            detail: "Seconds and nanoseconds. 'Two hours' is always 7,200 seconds, regardless of what the calendar does.",
          },
          {
            id: "period",
            name: "Period",
            kind: "final",
            parent: "human",
            tag: "calendar amount",
            detail:
              "Years, months and days. 'One month' is a different number of days depending on which month — which is exactly why it isn't a Duration.",
          },
        ]}
      />
      <CodeBlock language="java" filename="the core types" code={coreTypes} />

      <h2>Creating and manipulating</h2>
      <CodeBlock language="java" filename="everything returns a new value" code={creating} />
      <Callout variant="tip" title="All java.time types are immutable">
        <code>date.plusDays(1)</code> returns a new date and leaves the original alone — the same trap as{" "}
        <code>String</code>, with the same fix: assign the result. The upside is that these types are thread-safe
        and safe to share, unlike everything they replaced.
      </Callout>

      <h2>Duration versus Period</h2>
      <CodeBlock language="java" filename="machine time and human time" code={arithmetic} />
      <CodeBlock language="java" filename="the daylight saving trap" code={dstExample} />

      <AnalogyCard title="A stopwatch and a calendar.">
        A stopwatch measures elapsed time: two hours is two hours, always. A calendar measures human intervals: "the
        same date next month" is 28, 30 or 31 days depending on where you start, and "same time tomorrow" can be 23
        or 25 hours when the clocks change. <code>Duration</code> is the stopwatch, <code>Period</code> is the
        calendar, and using the wrong one produces bugs that only appear twice a year.
      </AnalogyCard>

      <h2>Time zones</h2>
      <CodeBlock language="java" filename="Instant in, zone out" code={zones} />

      <h2>Formatting and parsing</h2>
      <CodeBlock language="java" filename="DateTimeFormatter" code={formatting} />

      <CommonMistake
        title="storing a LocalDateTime for a global event"
        wrong={`// A meeting created by a user in Tokyo, stored as LocalDateTime
LocalDateTime start = LocalDateTime.of(2026, 8, 20, 9, 0);
repository.save(new Meeting(start));

// A user in London opens it. 09:00 — but 09:00 where?
// The information needed to answer that was never stored.`}
        right={`// Store the instant, plus the zone if the local time matters
ZonedDateTime start = ZonedDateTime.of(
        LocalDateTime.of(2026, 8, 20, 9, 0), ZoneId.of("Asia/Tokyo"));

repository.save(new Meeting(start.toInstant(), start.getZone()));

// Display in whichever zone the viewer needs:
meeting.instant().atZone(viewerZone);`}
        explanation={
          <p>
            A <code>LocalDateTime</code> is a wall-clock reading with no zone, so it doesn't identify a moment —
            two of them can't be meaningfully compared or ordered across regions. Store an <code>Instant</code>{" "}
            for the moment, and store the zone separately if you need to redisplay the original local time or apply
            recurrence rules to it.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Use <code>LocalDate</code> for a date, <code>LocalTime</code> for a time of day, and{" "}
            <code>Instant</code> for an exact moment. They can't be changed once created, so methods like{" "}
            <code>plusDays</code> give you a new value you have to keep. Anything involving different countries
            needs a time zone.
          </p>
        }
        developer={
          <p>
            <code>java.time</code> types are immutable, thread-safe and value-based, so never synchronise on them or
            compare with <code>==</code>. <code>Instant</code> is the UTC timeline;{" "}
            <code>ZonedDateTime</code> applies zone rules including daylight-saving gaps and overlaps;{" "}
            <code>LocalDateTime</code> has no zone and therefore no instant. <code>Duration</code> is exact elapsed
            time and <code>Period</code> is calendar-based, which is why <code>plusDays(1)</code> and{" "}
            <code>plus(Duration.ofDays(1))</code> can differ by an hour. <code>DateTimeFormatter</code> is immutable
            and safe as a static field — unlike <code>SimpleDateFormat</code>.
          </p>
        }
        interview={
          <p>
            Expect: why <code>java.util.Date</code> was replaced (mutable, thread-unsafe formatters, 1900-based
            years, zero-based months); <code>LocalDateTime</code> versus <code>ZonedDateTime</code> versus{" "}
            <code>Instant</code>; and <code>Duration</code> versus <code>Period</code>. The daylight-saving example
            is the one that shows real understanding: adding one day and adding 24 hours are different operations,
            and both are correct answers to different questions.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Which type should you persist for 'the moment this order was placed'?"
        options={[
          { id: "a", text: "LocalDateTime, so it reads naturally in the database" },
          { id: "b", text: "Instant — an unambiguous point on the UTC timeline" },
          { id: "c", text: "LocalDate, since the time rarely matters" },
          { id: "d", text: "A String in the user's local format" },
        ]}
        correctId="b"
        explanation="An Instant identifies one moment regardless of where anyone is, so records from different regions sort and compare correctly. Convert to a ZonedDateTime only at the point of display. A LocalDateTime has no zone, so two of them from different regions cannot be meaningfully ordered."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Find the missing hour"
        hint={
          <p>
            Pick the daylight-saving transition date for your zone, construct a <code>ZonedDateTime</code> the day
            before, and compare <code>plusDays(1)</code> with <code>plus(Duration.ofDays(1))</code>.
          </p>
        }
      >
        Demonstrate a case where adding one day and adding 24 hours give different results, and explain which
        question each one answers. Then try constructing a <code>ZonedDateTime</code> for a wall-clock time that
        doesn't exist — inside the spring-forward gap — and find out what the API does with it.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the difference between LocalDateTime, ZonedDateTime and Instant?"
        answer={
          <p>
            <code>LocalDateTime</code> is a date and a time with <strong>no zone</strong>, so it does not identify a
            unique moment — "2026-08-20 09:00" is a different instant in Tokyo than in London. It's right when the
            zone genuinely doesn't matter, like a shop's opening time.{" "}
            <code>ZonedDateTime</code> adds a <code>ZoneId</code>, so it does identify a moment and understands
            daylight-saving rules, including gaps and overlaps — use it when you must schedule or display local
            wall-clock time. <code>Instant</code> is a point on the UTC timeline with no calendar concepts at all;
            it's what you persist, log and compare, because it's unambiguous everywhere. The usual architecture is:
            store <code>Instant</code>, convert to <code>ZonedDateTime</code> at the edges for display, and keep the
            originating zone alongside the instant if you need to reproduce the user's local time or apply
            recurrence rules.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Use java.time; Date, Calendar and SimpleDateFormat are mutable, error-prone, and thread-unsafe.",
          "All java.time types are immutable — assign the result of plusDays and friends.",
          "LocalDateTime has no zone and therefore no instant; ZonedDateTime does; Instant is UTC.",
          "Persist Instant, display ZonedDateTime, and store the zone separately when local time matters.",
          "Duration is exact elapsed time, Period is calendar time — they differ across daylight-saving boundaries.",
        ]}
      />
    </>
  )
}
