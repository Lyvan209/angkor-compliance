# 🗺️ How to Use the Project Management Files

This guide explains how to effectively use the permanent project management system for Angkor Compliance.

---

## 📁 **File Structure**

### **DEVELOPMENT_ROADMAP.md**
- **Purpose**: Comprehensive master plan with all phases, tasks, and specifications
- **Update Frequency**: Monthly or when major changes occur
- **Use For**: 
  - Long-term planning
  - Detailed task specifications
  - Dependency tracking
  - Technical requirements

### **PROJECT_STATUS.md**
- **Purpose**: Quick current status and progress tracking
- **Update Frequency**: Weekly or after completing major tasks
- **Use For**:
  - Daily/weekly team check-ins
  - Sprint planning
  - Progress reporting
  - Identifying blockers

---

## 🔄 **How to Update Progress**

### **When Starting a New Task:**
1. Update `PROJECT_STATUS.md` - change task status to `🟡 IN PROGRESS`
2. Add task to "Current Focus" section
3. Update team member assignments

### **When Completing a Task:**
1. Update `DEVELOPMENT_ROADMAP.md` - change `[ ]` to `[x]` for completed task
2. Update `PROJECT_STATUS.md` - move task to "Completed Tasks" section
3. Update phase progress status
4. Add completion date

### **When Encountering Blockers:**
1. Add blocker to "Current Blockers" section in `PROJECT_STATUS.md`
2. Update task status to `🔴 BLOCKED`
3. Document resolution plan

---

## 📊 **Status Indicators**

### **Task Status:**
- `⏳ PENDING` - Not started
- `🟡 IN PROGRESS` - Currently working on
- `✅ COMPLETED` - Finished successfully
- `🔴 BLOCKED` - Waiting for dependency/resolution
- `❌ CANCELLED` - No longer needed

### **Phase Status:**
- `⏳ PENDING` - Phase not started
- `🟡 IN PROGRESS` - Phase actively being worked on
- `✅ COMPLETED` - Phase finished
- `🔴 DELAYED` - Phase behind schedule

---

## 🎯 **Best Practices**

### **Daily Updates:**
- Update current task status
- Add any blockers encountered
- Update time estimates if needed

### **Weekly Reviews:**
- Review completed tasks
- Update PROJECT_STATUS.md
- Plan next week's priorities
- Check for dependency issues

### **Monthly Reviews:**
- Update DEVELOPMENT_ROADMAP.md
- Review phase progress
- Adjust timelines if needed
- Document lessons learned

---

## 👥 **Team Collaboration**

### **For Developers:**
- Check PROJECT_STATUS.md for current priorities
- Update task progress daily
- Flag blockers immediately
- Document technical decisions

### **For Project Managers:**
- Review both files weekly
- Update timelines and dependencies
- Coordinate with team on blockers
- Prepare status reports

### **For Stakeholders:**
- Review PROJECT_STATUS.md for quick updates
- Refer to DEVELOPMENT_ROADMAP.md for detailed plans
- Provide feedback on priorities
- Review milestone progress

---

## 🚀 **Quick Commands**

### **Starting Development Session:**
```bash
# 1. Check current status
cat PROJECT_STATUS.md

# 2. Review current phase details
grep -A 20 "Phase 1" DEVELOPMENT_ROADMAP.md

# 3. Update your task to IN PROGRESS
# Edit PROJECT_STATUS.md
```

### **Ending Development Session:**
```bash
# 1. Update completed tasks
# Edit both files as needed

# 2. Commit changes
git add *.md
git commit -m "Update project status - [task completed]"
```

---

## 📋 **Checklist for Updates**

### **Before Each Sprint:**
- [ ] Review previous sprint completion
- [ ] Update PROJECT_STATUS.md with new focus
- [ ] Check for dependency blockers
- [ ] Set next milestone dates

### **After Each Sprint:**
- [ ] Mark completed tasks in DEVELOPMENT_ROADMAP.md
- [ ] Update PROJECT_STATUS.md progress
- [ ] Document lessons learned
- [ ] Plan next sprint priorities

### **Monthly Reviews:**
- [ ] Update all completion percentages
- [ ] Review and adjust timelines
- [ ] Update risk assessment
- [ ] Document major decisions

---

## 💡 **Tips for Success**

1. **Keep It Current**: Update files regularly, don't let them become stale
2. **Be Specific**: Use clear, actionable task descriptions
3. **Track Dependencies**: Always note what blocks progress
4. **Celebrate Wins**: Document completed tasks and milestones
5. **Learn from Delays**: Document why things took longer than expected

---

*Remember: These files are living documents that should evolve with your project!* 