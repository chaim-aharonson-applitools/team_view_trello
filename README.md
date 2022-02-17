# team_view_trello
Chrome extenstion which allows to manage team members and highlights their relevant tickets
## Installation
- Download or clone the repository
- On Chrome, go to extensions page, make sure 'developer mode' is active
- click 'Load unpacked' and navigate to repository folder
- that's it
- **Updating to new version**:
  - Replace local extension folder with fresh downloaded code
  - On Chrome extensions page, click reload icon inside extension cube
  - **IMPORTANT!** Need to refresh the Trello page before opening the extension for the first time after upgrading

## Main features
- Initially the team list is empty
- You may add or remove members from/to list
- Checking a member will add border around all it's relevant tickets and highlight the ticket title
- Option to view the filter by fade out or hide 'other users' 
- Team list and selected members are kept in local storage (along with selected view filter)
- Use user-id and not user name, same as mentioning in tickets (aka: 'chaimaharonson3' not 'chaim aharonson')

## What's New (version 0.2 17/02/2022)
- The option to add a user by user-id was removed, instead:
  - Edit mode will automatically fetch all users list (appear in page!)
  - Multiple users may be selected in order to add to team list
- Users and team lists are sorted by name
- **Known issues**:
  - Toggling out of 'edit mode' does not decrease the popup height
## Future features
  - Pack extension to allow downloading from 'Chrome webstore'
  - Add ability to set a different ticket border color per each person on team list (manually or automatically from a closed list of colors)
  - Done: 
  - >add option to present list of all users and allow adding from this list
