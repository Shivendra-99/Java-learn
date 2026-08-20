import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"
import { TerminalDemo } from "@/components/lesson/terminal-demo"

const whyBuildTool = `# Compiling one file by hand is fine
javac Main.java && java Main

# Compiling a real project by hand is not:
javac -cp "lib/gson-2.10.jar:lib/slf4j-api-2.0.9.jar:lib/slf4j-simple-2.0.9.jar" \\
      -d target/classes \\
      $(find src/main/java -name '*.java')

# ...and you still have to download those jars, find THEIR dependencies,
# run the tests, package it, and do the same thing identically on CI.
# That is what a build tool does.`

const layout = `# The standard layout — Maven invented it, Gradle adopted it,
# and every Java tool now assumes it
my-app/
├── pom.xml                 (or build.gradle)
├── src/
│   ├── main/
│   │   ├── java/           production source
│   │   └── resources/      config, templates — copied onto the classpath
│   └── test/
│       ├── java/           test source, not shipped
│       └── resources/      test-only config
└── target/                 (or build/) generated output — never committed`

const pom = `<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>

    <!-- Coordinates: these three uniquely identify your artifact -->
    <groupId>com.example</groupId>
    <artifactId>billing-service</artifactId>
    <version>1.0.0-SNAPSHOT</version>

    <properties>
        <maven.compiler.release>21</maven.compiler.release>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <dependency>
            <groupId>com.google.code.gson</groupId>
            <artifactId>gson</artifactId>
            <version>2.10.1</version>
        </dependency>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>5.10.2</version>
            <scope>test</scope>          <!-- not on the runtime classpath -->
        </dependency>
    </dependencies>
</project>`

const gradle = `plugins {
    id 'java'
    id 'application'
}

java {
    toolchain { languageVersion = JavaLanguageVersion.of(21) }
}

repositories { mavenCentral() }

dependencies {
    implementation 'com.google.code.gson:gson:2.10.1'
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.2'
}

application { mainClass = 'com.example.Main' }

// Same coordinates, same repository, far less XML.`

const scopes = `Maven scope     Gradle configuration     On compile classpath?  Shipped?
-------------   ----------------------   ---------------------  --------
compile         implementation           yes                    yes
provided        compileOnly              yes                    no  (container supplies it)
runtime         runtimeOnly              no                     yes (e.g. a JDBC driver)
test            testImplementation       tests only             no

# 'api' in Gradle is implementation that also leaks onto CONSUMERS'
# compile classpaths — use it only for types in your public signatures.`

const transitive = `# You depend on one thing; it depends on others
mvn dependency:tree

com.example:billing-service
└── org.springframework.boot:spring-boot-starter-web:3.2.0
    ├── org.springframework:spring-web:6.1.1
    ├── com.fasterxml.jackson.core:jackson-databind:2.15.3
    │   └── com.fasterxml.jackson.core:jackson-core:2.15.3
    └── org.apache.tomcat.embed:tomcat-embed-core:10.1.16

# Two dependencies wanting different versions of the same library
# is a CONFLICT. Maven resolves it by "nearest wins" — the shortest
# path from your project. Gradle picks the HIGHEST version.
# Both are guesses. Pin it explicitly when it matters:

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.16.1</version>
        </dependency>
    </dependencies>
</dependencyManagement>`

const lifecycle = `# Maven's lifecycle: each phase runs every phase before it
validate -> compile -> test -> package -> verify -> install -> deploy

mvn compile      # just compile main sources
mvn test         # compile + run tests
mvn package      # ...+ build the jar into target/
mvn verify       # ...+ integration tests and checks
mvn install      # ...+ copy to your local ~/.m2 repository
mvn clean test   # 'clean' deletes target/ first

# Gradle is task-based, not phase-based, and only reruns what changed:
./gradlew build
./gradlew test --tests '*OrderServiceTest'`

export default function BuildToolsLesson() {
  return (
    <>
      <p>
        A build tool does four things: fetches your dependencies, compiles, runs the tests, and packages the result
        — identically on your machine and on CI. Java has two that matter, Maven and Gradle, and they share enough
        vocabulary that learning one gets you most of the other.
      </p>

      <h2>Why not just javac?</h2>
      <CodeBlock language="bash" filename="the manual version" code={whyBuildTool} />

      <h2>The standard project layout</h2>
      <CodeBlock language="text" filename="convention over configuration" code={layout} />
      <p>
        This layout isn't a suggestion — put a file in the wrong place and it simply won't be compiled or packaged.
        The upside is that any Java developer can open any Java project and know where things are.
      </p>

      <h2>Maven</h2>
      <CodeBlock language="xml" filename="pom.xml" code={pom} />

      <h2>Gradle</h2>
      <CodeBlock language="groovy" filename="build.gradle" code={gradle} />
      <Callout variant="info" title="Which should you learn?">
        Maven if you're starting: it's declarative, predictable, and the overwhelming majority of tutorials and
        enterprise projects use it. Gradle when builds get complex — it's a real programming language, it's
        incremental, and Android requires it. The concepts transfer either way.
      </Callout>

      <h2>Coordinates and dependency scopes</h2>
      <CodeBlock language="text" filename="where a dependency applies" code={scopes} />
      <p>
        <code>groupId:artifactId:version</code> uniquely identifies any artifact in the world. That triple is what
        you paste from a library's README, and what Maven Central serves.
      </p>

      <AnalogyCard title="A recipe that also fetches the ingredients.">
        The pom or build file is the recipe: what this dish is called, what version it is, and exactly which
        ingredients at which quantities. The build tool then goes shopping, checks the ingredients' own ingredients,
        follows the method, and boxes the result — the same way every time, whether you're cooking or the CI server
        is.
      </AnalogyCard>

      <h2>Transitive dependencies</h2>
      <CodeBlock language="bash" filename="the tree, and the conflicts" code={transitive} />

      <h2>The lifecycle</h2>
      <CodeBlock language="bash" filename="Maven phases, Gradle tasks" code={lifecycle} />

      <TerminalDemo
        title="From nothing to a running jar"
        prompt="~/projects"
        steps={[
          {
            command: "mvn archetype:generate -DgroupId=com.example -DartifactId=billing -DinteractiveMode=false",
            output: ["[INFO] Project created from Archetype", "[INFO] BUILD SUCCESS"],
            note: "Generates the standard layout with a pom.xml. Most people start from Spring Initializr or their IDE instead, but the result is the same shape.",
          },
          {
            command: "mvn test",
            output: [
              "[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0",
              "[INFO] BUILD SUCCESS",
            ],
            note: "test implies compile — every phase runs the ones before it, so this compiled the sources first without being asked.",
          },
          {
            command: "mvn package",
            output: ["[INFO] Building jar: target/billing-1.0-SNAPSHOT.jar", "[INFO] BUILD SUCCESS"],
            note: "Compiles, tests, then packages. If a test fails the build stops here and no jar is produced — which is the point.",
          },
          {
            command: "mvn dependency:tree",
            output: [
              "com.example:billing:jar:1.0-SNAPSHOT",
              "\\- org.junit.jupiter:junit-jupiter:jar:5.10.2:test",
              "   \\- org.opentest4j:opentest4j:jar:1.3.0:test",
            ],
            note: "The first command to reach for when a dependency behaves unexpectedly — it shows what actually resolved, including versions you never asked for.",
          },
        ]}
      />

      <CommonMistake
        title="not using the wrapper"
        wrong={`# README says:
$ mvn clean install

# ...and it works on your machine with Maven 3.9,
# fails on a colleague's with 3.6, and does something
# different again on CI.`}
        right={`# Commit the wrapper, and everyone runs the same version
$ ./mvnw clean install       # Maven wrapper
$ ./gradlew build            # Gradle wrapper

# The wrapper script downloads the exact tool version the
# project declares, so the build is reproducible everywhere.`}
        explanation={
          <p>
            The wrapper is a small script plus a properties file naming the exact build tool version, committed to
            the repository. It removes "which version of Maven do I need?" from onboarding entirely, and it means CI
            doesn't need the tool pre-installed. Every modern Java project should have one.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            A build tool reads a file listing your project's name, its Java version and the libraries it needs. Then
            one command downloads those libraries, compiles your code, runs your tests and produces a jar. You never
            manage the classpath by hand.
          </p>
        }
        developer={
          <p>
            Artifacts are identified by <code>groupId:artifactId:version</code> and resolved from repositories,
            cached in <code>~/.m2</code> or <code>~/.gradle</code>. Dependencies are transitive, so conflicts are
            normal: Maven resolves by nearest-wins, Gradle by highest version, and both can be overridden with
            dependency management or constraints. Scopes control which classpath a dependency appears on. Maven has
            a fixed phase lifecycle; Gradle has a task graph with incremental builds and a build cache.
          </p>
        }
        interview={
          <p>
            Expect: what a build tool does; Maven versus Gradle (declarative XML with a fixed lifecycle versus a
            programmable, incremental task graph); what a transitive dependency is and how conflicts resolve; and
            the difference between <code>compile</code>/<code>provided</code>/<code>runtime</code>/<code>test</code>{" "}
            scopes. Knowing <code>mvn dependency:tree</code> as the diagnostic tool is a practical detail that lands
            well.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Two of your dependencies each pull in a different version of the same library. What does Maven do?"
        options={[
          { id: "a", text: "It fails the build with a conflict error" },
          { id: "b", text: "It picks the version nearest to your project in the dependency tree" },
          { id: "c", text: "It always picks the highest version" },
          { id: "d", text: "It includes both versions on the classpath" },
        ]}
        correctId="b"
        explanation="Maven uses nearest-wins: the shortest path from your project, with declaration order breaking ties. Gradle instead picks the highest version. Both are heuristics rather than correct answers, which is why an explicit pin in dependencyManagement (or a Gradle constraint) is the fix when it matters."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Find a dependency you never asked for"
        hint={
          <p>
            <code>mvn dependency:tree</code>, or <code>./gradlew dependencies --configuration runtimeClasspath</code>
            . Add <code>-Dverbose</code> to Maven's version to see which conflicts were resolved and how.
          </p>
        }
      >
        Create a project with one popular dependency and print the full dependency tree. Count how many artifacts
        you actually ended up with. Find one that appears twice at different versions and work out which one won and
        why — then pin it explicitly and confirm the tree changes.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is a transitive dependency, and why do version conflicts happen?"
        answer={
          <p>
            A transitive dependency is one you get indirectly: you declare library A, A declares B, so B lands on
            your classpath without you ever mentioning it. This is why a project with three declared dependencies
            can resolve to sixty artifacts. Conflicts arise because two of your direct dependencies may each require
            a different version of the same transitive library — and the JVM can only load one class per name, so
            exactly one version must win. Maven resolves it by <em>nearest wins</em>: the version fewest steps from
            your project, with declaration order breaking ties at equal depth. Gradle instead selects the{" "}
            <em>highest</em> version, on the theory that libraries are backwards compatible. Both are heuristics,
            and when they're wrong you get a <code>NoSuchMethodError</code> or{" "}
            <code>NoClassDefFoundError</code> at runtime despite a clean compile — because you compiled against one
            version and ran against another. The fix is to make the choice explicit, via{" "}
            <code>dependencyManagement</code>, a BOM, or a Gradle constraint, and to diagnose with{" "}
            <code>mvn dependency:tree</code>.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "A build tool resolves dependencies, compiles, tests and packages — reproducibly on every machine.",
          "src/main/java, src/test/java and target/ are conventions every Java tool assumes.",
          "groupId:artifactId:version identifies any artifact; scopes decide which classpath it joins.",
          "Dependencies are transitive, so conflicts are normal — Maven picks nearest, Gradle picks highest.",
          "Commit the wrapper (mvnw / gradlew) so everyone builds with the same tool version.",
        ]}
      />
    </>
  )
}
