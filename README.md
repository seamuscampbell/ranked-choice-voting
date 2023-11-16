# Ranked Choice Voting #

The issue with proprietary ranked choice voting systems is that there is no way for them to keep a "no endorsement" as a candidate from round to round as many organizations require. This program allows you to designate a candidate that cannot be eliminated (e.g. "no endorsement").

## Algorithm ##
- Put all candidates into a 2-dimensional array with the first dimension being the individual ballot and the second dimension being the order
- After each round, see who has the most votes at the front of their rankings
- If a candidate passes the win number (simple majority), remove them from contention
- If the number of spots for winning candidates is full, stop
- Otherwise, order the rankings and find the candidate with the fewest number of votes BUT if there is a "protected candidate" (e.g. "No Endorsement"), find the candidate with the second-fewest votes
- Remove the candidate with the fewest votes from all of the ballots (i.e. every candidate goes up one rank)
- Continue the process until the number of winners or number of remaining candidates equals the number of maximum winners
- If the round has only two candidates left, declare the candidate with the most votes in that round the winner

## Implementation ##
`$myelection = new RankedChoiceVote($votes,'No Endorsement',"Assemblymember",1);`
`$myelection ->conductElection();`
The arguments for the constructor are as follows: 
1. A multi-dimensional array of the votes with the first dimension being the individual ballot and the second dimension being the order of candidates
2. The name of the "protected candidate" (e.g. "No Endorsement")
3. The name of the office being sought,
4. The number of winners

## License ##
[Ranked Choice Voting](https://github.com/seamuscampbell/ranked-choice-voting/) by [Seamus Campbell](https://portfolio.seamuscampbell.nyc) is licensed under [Attribution-ShareAlike 4.0 International![](https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1)![](https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1)![](https://mirrors.creativecommons.org/presskit/icons/sa.svg?ref=chooser-v1)](http://creativecommons.org/licenses/by-sa/4.0/?ref=chooser-v1)
