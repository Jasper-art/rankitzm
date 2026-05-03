import os
import json
from fastapi import FastAPI
from groq import Groq
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

SYLLABUS_DIR = Path("public/syllabus")

def groq_generate(prompt: str) -> str:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=4096
    )
    return response.choices[0].message.content

def load_syllabus(subject: str, form: int) -> dict:
    syllabus_file = SYLLABUS_DIR / f"secondary/form{form}/{subject.lower()}{form}.json"
    if not syllabus_file.exists():
        return {"subject": subject, "form": form, "topics": []}
    with open(syllabus_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_topic_data(syllabus: dict, topic_name: str, sub_topic_name: str) -> dict:
    for topic in syllabus.get("topics", []):
        if topic["topic"].lower() == topic_name.lower():
            for sub_topic in topic.get("subTopics", []):
                if sub_topic["name"].lower() == sub_topic_name.lower():
                    return {
                        "topic": f"{topic.get('number', '')} {topic['topic']}".strip(),
                        "subTopic": f"{sub_topic.get('number', '')} {sub_topic['name']}".strip(),
                        "competences": sub_topic.get("specificCompetences", []),
                        "activities": sub_topic.get("learningActivities", [])
                    }
    return None


@app.get("/api/generate")
async def generate_lesson(subject: str, topic: str, grade: str, subtopic: str = ""):
    try:
        form = int(grade.replace("Form ", "").replace("form ", ""))
    except:
        form = 1

    syllabus = load_syllabus(subject, form)
    topic_data = get_topic_data(syllabus, topic, subtopic) if subtopic else None

    syllabus_context = ""
    if topic_data:
        competences_text = "\n".join(f"  {c}" for c in topic_data["competences"])
        activities_text = "\n".join(f"  {a}" for a in topic_data["activities"])
        syllabus_context = f"""
ALIGN WITH ZAMBIA CDC SYLLABUS DATA:

Topic: {topic_data['topic']}
Sub-Topic: {topic_data['subTopic']}

SPECIFIC COMPETENCES (from syllabus):
{competences_text}

LEARNING ACTIVITIES (from syllabus):
{activities_text}

Use these exact competences and activities in your lesson plan.
"""

    prompt = f"""
    You are a Senior Education Officer in Zambia.
    Create a professional Lesson Plan following the official Zambia MoE CDC format exactly.

    Subject: {subject}
    Topic: {topic}
    Sub-Topic: {subtopic}
    Grade/Class: {grade}

    {syllabus_context}

    Structure the response with these EXACT headings:

    GENERAL COMPETENCES: (from the 12 general competencies)
    SPECIFIC COMPETENCES: (from the syllabus)
    LESSON GOAL: (what learners will achieve)
    RATIONALE: (why this lesson matters)
    PRIOR KNOWLEDGE: (what learners already know)
    REFERENCES: (textbook and TG page numbers)
    Natural environment: (e.g. classroom, field)
    Artificial environment: (e.g. laboratory)
    Technological environment: (e.g. computers, projector)
    TEACHING AND LEARNING MATERIALS: (list resources)
    EXPECTED STANDARD: (from the syllabus)

    INTRODUCTION
    Teacher: (teacher activities)
    Learner: (learner activities)
    Assessment: (assessment criteria)

    LESSON DEVELOPMENT
    Teacher: (teacher activities)
    Learner: (learner activities)
    Assessment: (assessment criteria)

    EXERCISE
    Teacher: (teacher activities)
    Learner: (learner activities)
    Assessment: (assessment criteria)

    HOMEWORK
    Teacher: (teacher activities)
    Learner: (learner activities)
    Assessment: (assessment criteria)

    CONCLUSION
    Teacher: (teacher activities)
    Learner: (learner activities)
    Assessment: (assessment criteria)

    LESSON EVALUATION: (how the lesson went, what to improve)
    """
    try:
        return {"plan": groq_generate(prompt)}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/topics")
async def get_topics(subject: str, form: int):
    syllabus = load_syllabus(subject, form)
    topics = []
    for topic in syllabus.get("topics", []):
        sub_topics = [
            f"{st.get('number', '')} {st['name']}".strip()
            for st in topic.get("subTopics", [])
        ]
        topics.append({
            "topic": f"{topic.get('number', '')} {topic['topic']}".strip(),
            "subTopics": sub_topics
        })
    return {"topics": topics}


@app.get("/api/syllabi")
async def get_syllabi():
    syllabi_list = []
    if SYLLABUS_DIR.exists():
        for file in SYLLABUS_DIR.glob("**/*.json"):
            try:
                with open(file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    syllabi_list.append({
                        "subject": data.get("subject"),
                        "form": data.get("form"),
                        "filename": file.name
                    })
            except:
                pass
    return {"syllabi": syllabi_list}


@app.get("/api/generate-scheme")
async def generate_scheme(subject: str, grade: str, term: str):
    try:
        form = int(grade.replace("Form ", "").replace("form ", "").replace("Grade ", "").strip())
    except:
        form = 1

    syllabus = load_syllabus(subject, form)

    topics_text = ""
    for topic in syllabus.get("topics", []):
        for sub_topic in topic.get("subTopics", []):
            competences = " | ".join(sub_topic.get("specificCompetences", []))
            topic_label = f"{topic.get('number', '')} {topic['topic']}".strip()
            subtopic_label = f"{sub_topic.get('number', '')} {sub_topic['name']}".strip()
            topics_text += f"\n- Topic: {topic_label} | Sub-Topic: {subtopic_label} | Competences: {competences}"

    prompt = f"""
    You are a Senior Education Officer in Zambia.
    Create a 13-week Scheme of Work for {subject}, Grade {grade}, Term {term}.

    YOU MUST USE ONLY THESE EXACT TOPICS AND SUBTOPICS FROM THE ZAMBIA CDC SYLLABUS. DO NOT INVENT ANY:
{topics_text}

    Follow the Zambia CDC curriculum format with these columns:
    Week | Topic | Sub-Topic | Specific Outcomes | Teaching Methods | Teaching Aids | Assessment

    Cover 13 weeks using only the topics listed above. Be specific and practical for Zambian classrooms.
    """
    try:
        return {"scheme": groq_generate(prompt)}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/generate-scheme-grid")
async def generate_scheme_grid(subject: str, grade: str, term: str):
    try:
        form = int(grade.replace("Form ", "").replace("form ", "").replace("Grade ", "").strip())
    except:
        form = 1

    syllabus = load_syllabus(subject, form)

    syllabus_topics = []
    for topic in syllabus.get("topics", []):
        for sub_topic in topic.get("subTopics", []):
            competences = "\n".join(f"{c}" for c in sub_topic.get("specificCompetences", []))
            activities = "\n".join(f"{a}" for a in sub_topic.get("learningActivities", []))
            syllabus_topics.append({
                "topic": f"{topic.get('number', '')} {topic['topic']}".strip(),
                "subTopic": f"{sub_topic.get('number', '')} {sub_topic['name']}".strip(),
                "competence": competences,
                "strategies": activities
            })

    # Lookup by numbered key
    competence_lookup = {
        f"{t['topic']}|{t['subTopic']}": t['competence']
        for t in syllabus_topics
    }
    # Fallback lookup without number prefix
    competence_lookup.update({
        f"{t['topic'].split(' ', 1)[-1]}|{t['subTopic'].split(' ', 1)[-1]}": t['competence']
        for t in syllabus_topics
    })

    topics_text = "\n".join(
        f"{i+1}. Topic: {t['topic']} | Sub-Topic: {t['subTopic']} | Competence: {t['competence']} | Activities: {t['strategies']}"
        for i, t in enumerate(syllabus_topics)
    )

    prompt = f"""
    You are a Senior Education Officer in Zambia.
    Generate a 13-week Curriculum Analysis Grid for {subject}, Grade {grade}, Term {term} aligned to the Zambia MoE CBC curriculum.

    YOU MUST USE ONLY THESE EXACT TOPICS AND SUBTOPICS FROM THE ZAMBIA CDC SYLLABUS FOR TEACHING WEEKS. DO NOT INVENT ANY:
{topics_text}

    STRICT WEEK RULES - DO NOT CHANGE THESE:
    - Week 6: ALWAYS "Mid-Term Review" | subTopic: "Consolidation of Knowledge"
    - Week 11: ALWAYS "Revision" | subTopic: "Consolidation of Knowledge"
    - Week 12: ALWAYS "End-of-Term Test" | subTopic: "Comprehensive Assessment"
    - Week 13: ALWAYS "End-of-Term Closure" | subTopic: "Assessment and Reflection"

    Distribute the syllabus topics across Weeks 1-5 and Weeks 7-10 only (8 teaching weeks).
    If there are more than 8 topics, pick the most important for Term {term}.
    If fewer than 8, some topics may span multiple weeks.

    Return ONLY a valid JSON array with exactly 13 objects. No markdown, no explanation, no code fences.
    Each object must have these EXACT keys:
    week, topic, subTopic, philosophy, competence, concepts, strategies, assessment, environment, materials, materialsStructuring, teacher, references

    The topic, subTopic AND competence for teaching weeks MUST come exactly as written in the syllabus list above including the numbering. DO NOT paraphrase or rewrite.

    The philosophy field MUST always follow this exact format:
    "Philosophy: [curriculum philosophy].\\nGoal: [specific lesson goal for that subtopic]."

    Example of one teaching week object:
    {{"week":"Week 1","topic":"1.1 Numbers","subTopic":"1.1.1 Classification of Numbers","philosophy":"Philosophy: Learner-centred, promotes critical thinking.\\nGoal: Apply classification of numbers in real life context.","competence":"1.1.1.1 Apply classification of numbers in real life context","concepts":"Natural numbers, whole numbers, integers, prime, even, odd, rational, irrational, composite numbers","strategies":"Exploration, discovery, group work","assessment":"Oral questions, classwork","environment":"Classroom","materials":"Number cards, puzzles, games","materialsStructuring":"Infographics, number pattern charts","teacher":"Taught","references":"Grade {grade} {subject} TG pg 1"}}

    Return the full array of 13 objects only.
    """
    try:
        text = groq_generate(prompt).replace("```json", "").replace("```", "").strip()
        grid_data = json.loads(text)

        # Enforce exact competence from syllabus per topic/subtopic
        for row in grid_data:
            key = f"{row.get('topic', '')}|{row.get('subTopic', '')}"
            if key in competence_lookup:
                row['competence'] = competence_lookup[key]
            else:
                # Try fallback without number
                topic_bare = row.get('topic', '').split(' ', 1)[-1]
                subtopic_bare = row.get('subTopic', '').split(' ', 1)[-1]
                fallback_key = f"{topic_bare}|{subtopic_bare}"
                if fallback_key in competence_lookup:
                    row['competence'] = competence_lookup[fallback_key]

        # Hardcode special weeks — Python overrides Groq
        def special_week(week_label, topic, subtopic, philosophy, competence, strategies, assessment, mat_struct, teacher):
            return {
                "week": week_label,
                "topic": topic,
                "subTopic": subtopic,
                "philosophy": philosophy,
                "competence": competence,
                "concepts": "Summary exercises, review activities",
                "strategies": strategies,
                "assessment": assessment,
                "environment": "Classroom",
                "materials": "Review sheets, summary charts",
                "materialsStructuring": mat_struct,
                "teacher": teacher,
                "references": "Syllabus Reference"
            }

        grid_data[5] = special_week(
            "Week 6", "Mid-Term Review", "Consolidation of Knowledge",
            "Philosophy: Reinforcing learning through reflection.\nGoal: Summarize key concepts covered in Weeks 1-5.",
            "Review knowledge and improve competency",
            "Group discussions, peer collaboration, presentations",
            "Mid-term assessments",
            "Interactive discussion worksheets, problem-solving guides",
            "Revision"
        )
        grid_data[10] = special_week(
            "Week 11", "Revision", "Consolidation of Knowledge",
            "Philosophy: Reinforcing competency through revision.\nGoal: Summarize term concepts and evaluate understanding.",
            "Apply acquired skills in simulated tasks",
            "Collaborative discussions, peer presentations",
            "Quizzes, recap drills",
            "Revision workbooks, interactive summaries",
            "Revision"
        )
        grid_data[11] = special_week(
            "Week 12", "End-of-Term Test", "Comprehensive Assessment",
            "Philosophy: Evaluating student comprehension.\nGoal: Apply knowledge in structured test scenarios.",
            "Demonstrate competency through practical application",
            "Summative test, peer reviews",
            "Summative test",
            "Sample exams, structured feedback sheets",
            "Testing"
        )
        grid_data[12] = special_week(
            "Week 13", "End-of-Term Closure", "Assessment and Reflection",
            "Philosophy: Wrapping up the term with learning analysis.\nGoal: Evaluate learning progress and provide feedback.",
            "Self-assess growth and identify improvement areas",
            "Peer evaluations, feedback analysis",
            "Peer evaluations",
            "Guided reflections, future learning plans",
            "Closing"
        )

        return {"gridData": grid_data}
    except Exception as e:
        return {"error": str(e), "gridData": []}


@app.get("/api/generate-record")
async def generate_record(
    subject: str,
    grade: str,
    date: str,
    topic: str,
    attendance: str = "",
    remarks: str = ""
):
    try:
        form = int(grade.replace("Form ", "").replace("form ", ""))
    except:
        form = 1

    prompt = f"""
    You are a Senior Education Officer in Zambia.
    Write a professional Daily Record of Work entry for this lesson:

    Subject: {subject}
    Grade: {grade}
    Date: {date}
    Topic Taught: {topic}
    Class Attendance: {attendance}
    Teacher's Remarks: {remarks}

    The record MUST follow the Zambia CDC/MoE format and include:
    1. DATE & SUBJECT: Header information
    2. TOPIC TAUGHT: What was covered
    3. SPECIFIC OUTCOMES ACHIEVED: What learners accomplished
    4. TEACHER ACTIVITIES: What the teacher did
    5. LEARNER ACTIVITIES: What learners did
    6. ATTENDANCE: Recorded attendance
    7. ASSESSMENT USED: How understanding was checked
    8. REMARKS & FOLLOW-UP: Any notes, absentees, homework given

    Write it as a clean, professional record entry.
    """
    try:
        return {"record": groq_generate(prompt)}
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)