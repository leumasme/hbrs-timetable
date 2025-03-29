# HBRS Timetable

Available via GitHub Pages at https://leumasme.github.io/hbrs-timetable/src/

Custom timetable frontent for the HBRS timetable.  
Data is scraped via [leumasme/timetable-scraper-api](https://github.com/leumasme/timetable-scraper-api)

Created as an obligatory project for the Web Engineering course.  
As part of this course, it had to be programmed in full Vanilla JS/HTML/CSS (I would have otherwise preferred Svelte+Typescript)

| ![Event Picker](https://github.com/user-attachments/assets/92b17319-16bb-484b-a76e-0db8dd246a7c) | ![Timetable Display](https://github.com/user-attachments/assets/41bd4c2f-5a52-4bb4-bd4c-e183d78eb020) |
| -- | -- |

## Features

- Pick your desired Semesters/Classes/Events from a list of nested checkboxes
  - Remembers previously picked elements
- Display your selected Events in a timetable
  - Events are coloured based on their type and belonging course
  - Hovering an event highlights all events which belong to the same course
  - Clicking an Event removes it from the display and updates the memorized picked elements
  - Overlapping events are sorted so more important/longer ones are further up
  - The timetable is fully generated to fit the selected events
    - Empty days will be hidden
    - Days will have exactly as many rows as needed in case of overlaps
    - Start- and End time on X-axis will match the earliest start and latest end of events

## Issues

- The project accidentally devolved into a Single-Page Application
  - Splitting the Event selector and the Timetable display would be preferrable for organization and to make it possible to bookmark&share the timetable display page
- The page isn't particularly pretty
  - I'm not good at design, nor am i great at CSS 
- See issues in the underlying data scraping repo: [leumasme/timetable-scraper-api](https://github.com/leumasme/timetable-scraper-api)

## See Also

- [Eva2 Cleaner](https://github.com/leumasme/hbrs-tampermonkey)
  - My first attempt at cleaning up the official timetable, via a tampermoney script
- [sotterbeck/hbrs-cal-creator](https://github.com/sotterbeck/hbrs-cal-creator)
  - Prettier design
  - Less practical event selector
  - Allows exporting selected events as `.ics` calendar file, but does not support displaying in browser
- [Hochgesand/H-BRSiCalGenerator](https://github.com/Hochgesand/H-BRSiCalGenerator)
  - Not maintained anymore (Creator is not a student at HBRS anymore), maybe already dysfunctional
  - Exports as calendar file via email, no in-browser display
  - Complex backend setup (sends emails)
