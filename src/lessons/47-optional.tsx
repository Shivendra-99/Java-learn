import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { OutputPredictor } from "@/components/lesson/output-predictor"
import { Quiz } from "@/components/lesson/quiz"

const problem = `// The signature tells you nothing about whether null is possible
public User findByEmail(String email) { ... }

User user = findByEmail(email);
user.getName();          // NullPointerException, maybe — who knows?

// With Optional, the possibility is part of the type
public Optional<User> findByEmail(String email) { ... }

findByEmail(email)
        .map(User::getName)
        .orElse("unknown");     // the compiler will not let you forget`

const creating = `Optional.of(value)              // value must NOT be null, throws if it is
Optional.ofNullable(value)      // null becomes an empty Optional
Optional.empty()                // explicitly nothing

// In the JDK, Optional turns up wherever "not found" is normal:
map.entrySet().stream().findFirst();
list.stream().max(comparator);
Optional.ofNullable(map.get(key));`

const consuming = `Optional<User> maybe = findByEmail(email);

maybe.isPresent()                  // true / false  — usually a code smell
maybe.isEmpty()                    // Java 11+
maybe.get()                        // throws NoSuchElementException if empty — avoid

maybe.orElse(User.GUEST)                    // a default value
maybe.orElseGet(() -> loadDefaultUser())    // a default computed only if needed
maybe.orElseThrow()                         // NoSuchElementException
maybe.orElseThrow(() -> new UserNotFoundException(email))

maybe.ifPresent(user -> log.info("found {}", user.id()));
maybe.ifPresentOrElse(this::render, this::renderEmpty);   // Java 9+

maybe.map(User::email)                      // Optional<String>
     .filter(e -> e.endsWith("@example.com"))
     .orElse("none");

maybe.flatMap(User::manager)                // when the mapper ALSO returns Optional
     .map(User::name);

maybe.stream()                              // Java 9+: 0 or 1 elements
     .forEach(this::process);`

const orElseTrap = `// orElse ALWAYS evaluates its argument, even when the Optional is present
Optional.of(cachedUser).orElse(loadFromDatabase());
//                              ^ runs regardless. A wasted query every time.

// orElseGet defers it
Optional.of(cachedUser).orElseGet(() -> loadFromDatabase());
//                                      ^ only runs if empty

// Rule of thumb: orElse for a constant, orElseGet for anything
// that costs something or has a side effect.`

const chaining = `// Nested null checks
public String managerEmail(Long userId) {
    User user = repository.find(userId);
    if (user != null) {
        User manager = user.getManager();
        if (manager != null) {
            String email = manager.getEmail();
            if (email != null) {
                return email.toLowerCase();
            }
        }
    }
    return "unassigned";
}

// The same logic, as a chain
public String managerEmail(Long userId) {
    return repository.find(userId)          // Optional<User>
            .flatMap(User::manager)          // Optional<User>
            .map(User::email)                // Optional<String>
            .map(String::toLowerCase)
            .orElse("unassigned");
}`

const orElsePredictor = `import java.util.*;

public class Defaults {
    static String expensive() {
        System.out.println("computing");
        return "computed";
    }

    public static void main(String[] args) {
        Optional<String> present = Optional.of("value");
        String result = present.orElse(expensive());
        System.out.println(result);
    }
}`

const misuse = `// 1. As a field — Optional is not Serializable and adds a wrapper per instance
public class User {
    private Optional<String> middleName;    // don't
    private String middleName;              // do — null means absent
}

// 2. As a parameter — the caller must now wrap, and can still pass null
public void register(Optional<String> referrer) { }     // don't
public void register(String referrer) { }               // do, and document nullability
public void register() { }                              // or overload

// 3. In a collection — an empty list already means "nothing"
List<Optional<Order>> orders;      // don't
List<Order> orders;                // do

// Optional was designed for ONE job: a return type that might have no result.`

export default function OptionalLesson() {
  return (
    <>
      <p>
        <code>Optional</code> is a container that holds either one value or nothing. Its purpose isn't to eliminate{" "}
        <code>null</code> — you can't — but to make "there might be no result" visible in a method's{" "}
        <em>signature</em>, where the compiler can involve itself.
      </p>

      <h2>The problem it solves</h2>
      <CodeBlock language="java" filename="an honest return type" code={problem} />

      <h2>Creating</h2>
      <CodeBlock language="java" filename="three factories" code={creating} />

      <h2>Consuming</h2>
      <CodeBlock language="java" filename="the API" code={consuming} />
      <Callout variant="warning" title="get() and isPresent() are the ones to avoid">
        <code>{"if (opt.isPresent()) { opt.get(); }"}</code> is a null check wearing a costume — same shape, same
        chance of forgetting, plus a wrapper object. The value of <code>Optional</code> comes from{" "}
        <code>map</code>, <code>filter</code>, <code>orElse</code> and <code>ifPresent</code>, which make the empty
        case impossible to overlook.
      </Callout>

      <h2>Chaining beats nesting</h2>
      <CodeBlock language="java" filename="the payoff" code={chaining} />
      <p>
        Note <code>flatMap</code>: use it when the mapper itself returns an <code>Optional</code>, or you end up
        with <code>Optional&lt;Optional&lt;User&gt;&gt;</code>. The same rule as with streams.
      </p>

      <AnalogyCard title="A sealed envelope that might be empty.">
        Handing someone a value says "here it is". Handing them <code>null</code> says nothing at all until they
        open their hand and it's empty. An <code>Optional</code> is a labelled envelope: they can see it might be
        empty before opening it, and the label tells them to plan for that. Opening it without looking —{" "}
        <code>get()</code> — puts you right back where you started.
      </AnalogyCard>

      <h2>orElse versus orElseGet</h2>
      <OutputPredictor
        question="The Optional is present — does expensive() run?"
        code={orElsePredictor}
        options={[
          { id: "a", text: "value" },
          { id: "b", text: "computing\nvalue" },
          { id: "c", text: "computing\ncomputed" },
          { id: "d", text: "computed" },
        ]}
        correctId="b"
        explanation={
          <p>
            <code>orElse</code> takes a <em>value</em>, so its argument is evaluated before the call happens —
            regardless of whether the Optional is present. "computing" prints, the result is discarded, and "value"
            is returned. <code>orElseGet</code> takes a <code>Supplier</code> and only invokes it when empty. Use{" "}
            <code>orElse</code> for constants and <code>orElseGet</code> for anything that costs something.
          </p>
        }
      />
      <CodeBlock language="java" filename="the trap in isolation" code={orElseTrap} />

      <h2>Where Optional does not belong</h2>
      <CodeBlock language="java" filename="three misuses" code={misuse} />

      <CommonMistake
        title="Optional.get() without checking"
        wrong={`Optional<User> user = repository.findByEmail(email);
return user.get().getName();
// NoSuchElementException: No value present
//
// You have swapped one runtime exception for another, and
// added an object allocation for the privilege.`}
        right={`return repository.findByEmail(email)
        .map(User::getName)
        .orElseThrow(() -> new UserNotFoundException(email));

// Or, when a default is right:
return repository.findByEmail(email)
        .map(User::getName)
        .orElse("Guest");`}
        explanation={
          <p>
            If you're going to throw when it's empty, use <code>orElseThrow</code> with a meaningful exception —
            it's shorter and the error names the actual problem, rather than "No value present" from somewhere in
            the middle of your service layer. Reserve <code>get()</code> for cases where you've genuinely just
            proved presence, and even then <code>orElseThrow()</code> reads better.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            <code>Optional</code> is a box that either holds something or is empty. A method returning one is
            telling you it might not find anything, so you have to say what should happen if it doesn't — a default,
            an exception, or skipping the work.
          </p>
        }
        developer={
          <p>
            It's a value-based class: don't synchronise on it or compare with <code>==</code>, and note it isn't{" "}
            <code>Serializable</code>, which is why it's unsuitable as a field. <code>orElse</code> is eagerly
            evaluated while <code>orElseGet</code> is lazy. <code>map</code> versus <code>flatMap</code> follows the
            usual rule. <code>Optional.stream()</code> (Java 9) makes it composable with the Streams API, and the
            primitive variants <code>OptionalInt</code>/<code>OptionalLong</code>/<code>OptionalDouble</code> avoid
            boxing but have a much thinner API.
          </p>
        }
        interview={
          <p>
            The three questions that come up: why <code>Optional</code> exists (nullability in the signature, not
            null elimination); <code>orElse</code> versus <code>orElseGet</code> and the eager-evaluation trap; and
            where it shouldn't be used — fields, parameters, and collections. Being able to state Brian Goetz's
            original framing, that it was designed specifically as a return type for "no result", answers most of
            it in one sentence.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why should Optional not be used as a method parameter?"
        options={[
          { id: "a", text: "It is slower than passing null" },
          { id: "b", text: "The caller is forced to wrap the value, and can still pass null for the Optional itself — so you gain nothing and add ceremony" },
          { id: "c", text: "Optional cannot be used as a generic type argument" },
          { id: "d", text: "It causes a compile error" },
        ]}
        correctId="b"
        explanation="A parameter of type Optional<T> can itself be null, so you still need a null check — and every call site has to write Optional.of(...). Overloading the method, or documenting the parameter as nullable, is both clearer and cheaper. Optional was designed as a return type."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Flatten a nest of null checks"
        hint={
          <p>
            Each lookup that might fail becomes an <code>Optional</code>-returning method, and each subsequent step
            is <code>map</code> — or <code>flatMap</code> when that step can also fail.
          </p>
        }
      >
        Take a three-level lookup — an order, its customer, that customer's address — where any step might be
        missing, written with nested null checks. Convert it into a single <code>Optional</code> chain ending in a
        default. Then add a filter (only addresses in a given country) and note how little the chain changes
        compared with what the nested version would need.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What problem does Optional solve, and how is it commonly misused?"
        answer={
          <p>
            It makes the possibility of "no result" part of a method's type, so a caller can't overlook it the way
            they can overlook a <code>null</code> return — <code>Optional&lt;User&gt; findByEmail(...)</code> tells
            you at compile time what <code>User findByEmail(...)</code> only tells you at 3am. It also composes:{" "}
            <code>map</code>, <code>flatMap</code>, <code>filter</code> and <code>orElseThrow</code> flatten nested
            null checks into a chain. The misuses are well known. Using it as a <strong>field</strong> — it isn't{" "}
            <code>Serializable</code> and adds an allocation per instance. As a <strong>parameter</strong> — the
            caller must wrap, and can still pass a null Optional, so you've added ceremony without safety. Inside a{" "}
            <strong>collection</strong> — an empty list already expresses absence. And calling{" "}
            <code>get()</code> after <code>isPresent()</code>, which is a null check with extra steps and an extra
            object. It was designed for one job: a return type where no result is a normal outcome.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Optional makes 'might not exist' visible in the signature — it doesn't remove null from the language.",
          "Use map, flatMap, filter, ifPresent and orElseThrow; avoid get() and isPresent().",
          "orElse evaluates its argument eagerly; orElseGet defers it — this matters whenever it costs something.",
          "flatMap when the mapper itself returns an Optional, otherwise you nest them.",
          "Designed as a return type: not for fields, parameters, or collection elements.",
        ]}
      />
    </>
  )
}
